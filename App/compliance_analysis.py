import os
from rdflib import Graph, Namespace, URIRef
from rdflib.plugins.sparql import prepareQuery
from App import app
from App.exporter import create_dfd_rdf, BASE, RDFS

# Define namespaces
RR = Namespace('http://www.w3.org/ns/r2rml#')

# Load DB graphs
db_graph = Graph()
db_graph.parse(os.path.join(app.root_path, 'rdf_graphs',
                            'northwind_r2rml_mapping.ttl'),  format='turtle')
db_graph.parse(os.path.join(
    app.root_path, 'rdf_graphs', 'personal_data.ttl'), format='turtle')

# Create prepare queries
data_exists_query = prepareQuery('''
    ASK {
        { ?column rr:predicate ?data_uri . }
        UNION
        { ?data_uri rr:logicalTable ?table . }
    }
''', initNs={"rr": RR})

data_uses_query = prepareQuery('''
    SELECT DISTINCT ?itemName ?data ?dataName ?dataCategory
    WHERE {
        ?item BASE:associatedData ?data .
        ?item rdfs:label ?itemName .
        {
            ?data BASE:isOfPersonalDataCategory ?dataCategory .
            ?predicateObjectMap rr:predicate ?data .
            ?predicateObjectMap rr:objectMap ?columns .
            ?columns rr:column ?dataName .
        }
        UNION
        {
            ?data rr:logicalTable ?tablesNames .
            ?tablesNames rr:tableName ?dataName .
            ?data rr:predicateObjectMap ?predicateObjectMap .
            ?predicateObjectMap rr:predicate ?column .
            ?column BASE:isOfPersonalDataCategory ?dataCategory
        }
    }
''', initNs={'BASE': BASE, 'rdfs': RDFS, 'rr': RR})


def has_data_uri(data_uri):
    data_uri = URIRef(data_uri)
    result = db_graph.query(data_exists_query, initBindings={
        'data_uri': data_uri})
    return result.askAnswer


def get_personal_data_uses(serialized_dfd):
    dfd_graph = create_dfd_rdf(serialized_dfd)
    merged_graph = db_graph + dfd_graph
    result = merged_graph.query(data_uses_query)

    responce = {}
    for (item_name, data, data_name, personal_data_category) in result:
        print(personal_data_category)
        if item_name not in responce:
            responce[item_name] = {
                'data_uri': data.__str__(),
                'data_name': data_name.__str__(),
                'personal_data_category': [personal_data_category.__str__()]
            }
        else:
            responce[item_name]['personal_data_category'].append(
                personal_data_category.__str__())

    return responce
