import os
from rdflib import Graph, Namespace, URIRef
from rdflib.plugins.sparql import prepareQuery
from App import app
from App.exporter import create_dfd_rdf, BASE, RDFS, DFD

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
    ASK { ?data_uri rr:logicalTable | ^rr:predicate ?database_item . }
''', initNs={"rr": RR})

data_uses_query = prepareQuery('''
    SELECT DISTINCT ?itemName ?data ?dataName ?dataCategory
    WHERE {
        ?item BASE:associatedData ?data .
        ?item rdfs:label ?itemName .
        ?data (rr:predicateObjectMap/rr:predicate)?/BASE:isOfPersonalDataCategory  ?dataCategory .
        ?data rr:logicalTable/rr:tableName | ^rr:predicate/rr:objectMap/rr:column ?dataName .
    }
''', initNs={'BASE': BASE, 'rdfs': RDFS, 'rr': RR})

item_name_query = prepareQuery('''
    SELECT ?itemName
    WHERE {
        ?item rdfs:label ?itemName .
        ?item a ?type .
        FILTER ( ?type IN (dfd:Process, dfd:DataStore, dfd:DataFlow, dfd:Interface) )
    }
''', initNs={'rdfs': RDFS, 'dfd': DFD})


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


def perform_user_query(serialized_dfd, sparql_query):
    # Create RDF Graphs
    dfd_graph = create_dfd_rdf(serialized_dfd)
    merged_graph = db_graph + dfd_graph

    # Preform Query
    result = merged_graph.query(sparql_query)

    # Create responce for frontend
    selected_items = set()
    query_results = []
    for entry in result:
        # Add query result to responce
        query_results.append(entry.asdict())

        # Check if the user has selected a DFD item
        for item in entry:
            item_name_result = [name for name in merged_graph.query(
                item_name_query, initBindings={'item': item})]
            if item_name_result:
                # query returns iterable, get all items in a list and get the first entry and first item
                item_name = item_name_result[0][0].value
                selected_items.add(item_name)

    return {'query_results': query_results, 'selected_items': list(selected_items)}
