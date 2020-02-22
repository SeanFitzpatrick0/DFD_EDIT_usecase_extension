function toggle_query_box() {
	/**
	 * Toggles the display of the query box and button
	 */
	let query_button = document.getElementById("query_btn");
	if (query_button.classList.contains("active")) {
		query_button.classList.remove("active");
		hide_query_box();
	} else {
		query_button.classList.add("active");
		show_query_box();
	}
}

function show_query_box() {
	/**
	 * Shows the query box
	 */
	let query_box = document.getElementById("query_box");
	query_box.style.display = "block";
}

function hide_query_box() {
	/**
	 * Hides query box, resets inputs and removes selection
	 */
	let query_box = document.getElementById("query_box");
	query_box.style.display = "none";
	document.getElementById("query_box_input").value = "";
	remove_selected_styles();
}

async function execute_query() {
	/**
	 * Send users query to execute on the server and the
	 * resulting items will be highlighted.
	 * The user will be alerted of any errors in their query
	 */
	// Prevent page refresh
	this.event.preventDefault();

	// Remove pervious selection
	remove_selected_styles();

	// Get query
	let query = document.getElementById("query_box_input").value;

	// Check empty
	if (query.length === 0) {
		alert("Please enter a SPARQL into the text area before submitting");
		return;
	}

	// Make request
	let dfd = serialize_dfd(hierarchy);
	const SPARQL_QUERY_URL = "/sparql_query";
	let query_response = await fetch(SPARQL_QUERY_URL, {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ dfd, query })
	});
	let query_result = await query_response.json();

	// Render response
	if (query_result.success) {
		add_selected_styles(hierarchy, new Set(query_result.result));
		editor.graph.refresh();
	} else {
		alert(`Error: ${query_result.exception}`);
	}
}

function add_selected_styles(sub_hierarchy, selected_items) {
	/**
	 * Helper function to add a selected highlight to all items in selected_items
	 * @param {Object} sub_hierarchy The current sub diagram.
	 * @param {selected_items} selected_items a set with names of the items to highlight
	 */
	// Get graph
	let graph =
		sub_hierarchy.name === get_active_hierarchy_item_and_name()[1]
			? editor.graph.getModel()
			: sub_hierarchy.graph_model;
	// Set style for each cell
	for (cell_index in graph.cells) {
		let cell = graph.cells[cell_index];
		let cell_name = editor.graph.convertValueToString(cell);

		if (selected_items.has(cell_name))
			cell.style =
				cell.item_type === "flow"
					? SELECTED_EDGE_STYLE
					: SELECTED_CONTAINER_STYLE;
	}
	// Recurs though children diagrams
	sub_hierarchy.children.forEach(child =>
		add_selected_styles(child, selected_items)
	);
}

function remove_selected_styles() {
	/**
	 * Removes all selected styles from the DFD and re renders personal data
	 */
	_remove_selected_styles(hierarchy);
	editor.graph.refresh();
	// Re-render personal data that were blocked be selected styles
	render_personal_data_uses();
}

function _remove_selected_styles(sub_hierarchy) {
	/**
	 * Helper function that recursively removes all selection highlights from the DFD
	 * @param sub_hierarchy The current diagram
	 */
	// Get graph
	let graph =
		sub_hierarchy.name === get_active_hierarchy_item_and_name()[1]
			? editor.graph.getModel()
			: sub_hierarchy.graph_model;
	// Set style for each cell
	for (cell_index in graph.cells) {
		let cell = graph.cells[cell_index];
		if (cell.item_type)
			cell.style =
				cell.item_type === "flow" ? EDGE_STYLE : CONTAINER_STYLE;
	}

	sub_hierarchy.children.forEach(child => _remove_selected_styles(child));
}

/* Query box drag functionality from: https://jsfiddle.net/robertc/kKuqH/ */
function drag_start(event) {
	var style = window.getComputedStyle(event.target, null);
	event.dataTransfer.setData(
		"text/plain",
		parseInt(style.getPropertyValue("left"), 10) -
			event.clientX +
			"," +
			(parseInt(style.getPropertyValue("top"), 10) - event.clientY)
	);
}
function drag_over(event) {
	event.preventDefault();
	return false;
}
function drop(event) {
	var offset = event.dataTransfer.getData("text/plain").split(",");
	var dm = document.getElementById("query_box");
	dm.style.left = event.clientX + parseInt(offset[0], 10) + "px";
	dm.style.top = event.clientY + parseInt(offset[1], 10) + "px";
	event.preventDefault();
	return false;
}
var dm = document.getElementById("query_box");
dm.addEventListener("dragstart", drag_start, false);
document.body.addEventListener("dragover", drag_over, false);
document.body.addEventListener("drop", drop, false);
