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
    SELECT ?itemName ?data ?dataName ?dataCategory
    WHERE {
        ?item BASE:associatedData ?data .
        ?item rdfs:label ?itemName .
        ?data BASE:isOfPersonalDataCategory ?dataCategory .
        ?predicateObjectMap rr:predicate ?data .
        ?predicateObjectMap rr:objectMap ?columns .
        ?columns rr:column ?dataName .
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

    responce = {item_name.__str__(): {'data_uri': data.__str__(), 'data_name': data_name.__str__(
    ), 'personal_data_category': personal_data_category.__str__()} for (item_name, data, data_name, personal_data_category) in result}
    return responce
