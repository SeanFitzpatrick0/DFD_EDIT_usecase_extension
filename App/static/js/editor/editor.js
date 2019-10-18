function main(editor_path) {
	// Checks if browser is supported
	if (!mxClient.isBrowserSupported()) {
		mxUtils.error("This browser is not supported.", 200, false);
	} else {
		// Create Editor
		let graph_container = document.getElementById("graph");
		let toolbar_container = document.getElementById("toolbar");
		var editor = create_editor(
			`${editor_path}/config/keyhandler-commons.xml`,
			graph_container
		);
		create_toolbar(
			editor.graph,
			toolbar_container,
			`${editor_path}/images`
		);
	}
}

function create_toolbar(graph, toolbar_container, image_dir_path) {
	add_toolbar_item(
		graph,
		toolbar_container,
		"",
		`${image_dir_path}/rectangle.gif`
	);

	add_toolbar_item(
		graph,
		toolbar_container,
		"shape=ellipse",
		`${image_dir_path}/ellipse.gif`
	);
}

function create_editor(editor_config_path, graph_container) {
	// Create editor with key handler config
	mxObjectCodec.allowEval = true;
	var editor_config = mxUtils.load(editor_config_path).getDocumentElement();
	var editor = new mxEditor(editor_config);
	mxObjectCodec.allowEval = false;
	editor.setGraphContainer(graph_container);

	// Enable new connections in the graph
	editor.graph.setConnectable(true);

	// Enable guides
	mxGraphHandler.prototype.guidesEnabled = true;

	// Alt disables guides
	mxGuide.prototype.isEnabledForEvent = evt => {
		return !mxEvent.isAltDown(evt);
	};

	// Enables snapping way points to terminals
	mxEdgeHandler.prototype.snapToTerminals = true;

	// Does not allow dangling edges
	editor.graph.setAllowDanglingEdges(false);

	return editor;
}

function add_toolbar_item(graph, sidebar, style, image) {
	// Function that is executed when the image is dropped on the graph
	var add_item_to_graph = (graph, evt, cell, x, y) => {
		var parent = graph.getDefaultParent();
		var model = graph.getModel();
		var vertex = null;
		model.beginUpdate();
		try {
			vertex = graph.insertVertex(
				parent,
				null,
				"Test",
				x,
				y,
				120,
				120,
				style
			);
		} finally {
			model.endUpdate();
		}
		graph.setSelectionCell(vertex);
	};

	// Create toolbar item image
	var img = document.createElement("img");
	img.setAttribute("src", image);
	img.style.width = "48px";
	img.style.height = "48px";
	img.title = "Drag this to the diagram";
	sidebar.appendChild(img);

	// Shown when dragging item over graph
	var dragElt = document.createElement("div");
	dragElt.style.border = "dashed black 1px";
	dragElt.style.width = "120px";
	dragElt.style.height = "120px";

	// Creates draw preview
	var drag_preview = mxUtils.makeDraggable(
		img,
		graph,
		add_item_to_graph,
		dragElt,
		0,
		0,
		true,
		true
	);
	drag_preview.setGuidesEnabled(true);
}