import os
from rdflib import Graph
from App import app


db_graph = Graph()
db_graph.parse(os.path.join(app.root_path, 'rdf_graphs',
                            'northwind_r2rml_mapping.ttl'),  format='turtle')
personal_data_graph = Graph()
personal_data_graph.parse(os.path.join(
    app.root_path, 'rdf_graphs', 'personal_data.ttl'), format='turtle')


def has_data_uri(data_uri):
    result = db_graph.query(' \
        ASK { \
            { ?column rr:predicate <' + data_uri + '> . } \
            UNION \
            { <' + data_uri + '> rr:logicalTable ?table . } \
        }')
    return result.askAnswer
