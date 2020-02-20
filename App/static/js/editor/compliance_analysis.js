function show_data_association_menu(dataflow_name) {
	/**
	 * Shows the data association menu and info on personal data uses
	 * @param {String} dataflow_name The name of the selected data flow
	 */
	// Set data flow title
	document.getElementById(
		"data_association_menu_title"
	).innerText = dataflow_name;

	// Show data association menu
	/* set existing associated data URI if exists */
	let input_field = document.getElementById("data_association_input");
	let dataflow = find_cell_in_graph(
		editor.graph.getModel(),
		dataflow_name,
		"flow"
	);
	input_field.value = dataflow.associated_data
		? dataflow.associated_data
		: "";
	/* make visible */
	document.getElementById("data_association_menu").style.display = "block";

	// Show / Hide personal data uses info
	let dataflow_uses = personal_data_uses[dataflow_name];
	dataflow_uses
		? show_personal_data_uses_info(dataflow_uses)
		: hide_personal_data_uses_info();
}

function show_personal_data_uses_info(uses) {
	/**
	 * Show personal data uses summary section
	 * @param {Object} uses Details of the personal data uses of that item
	 */
	// Get readable data category
	let personal_data_category_name = uses.personal_data_category
		.split("#")
		.pop();
	// Set summary content
	document.getElementById(
		"personal_data_uses_summary"
	).innerHTML = `This data flow uses the column 
		<span class="badge badge-light">${uses.data_name}</span> (${uses.data_uri}) 
		which uses the personal data 
		<a href=${uses.personal_data_category}>${personal_data_category_name}</a>.`;
	// Make visible
	document.getElementById("personal_data_uses_info").style.display = "block";
}

function hide_personal_data_uses_info() {
	/**
	 * Remove personal data use summary content and hides section
	 */
	document.getElementById("personal_data_uses_summary").innerHTML = "";
	document.getElementById("personal_data_uses_info").style.display = "none";
}

async function update_data_association() {
	/**
	 * Updates or Assigns an associated data URI to a data flow
	 * The user will be alerted if the given URI is not a column or table in the DB
	 */
	// Prevent default page refresh on submit
	this.event.preventDefault();
	let dataflow_name = document.getElementById("data_association_menu_title")
		.innerText;
	let dataflow = find_cell_in_graph(
		editor.graph.getModel(),
		dataflow_name,
		"flow"
	);
	let current_process_name = get_active_hierarchy_item_and_name()[1];

	// Update data association
	let input_field = document.getElementById("data_association_input");
	let data_uri = input_field.value;

	if (data_uri.length === 0) {
		// Remove associated data attribute if empty input
		delete dataflow.associated_data;
	} else {
		// Check if data URI exists
		const check_exists_url = "/compliance/data_uri_exists";
		let check_response = await fetch(check_exists_url, {
			method: "POST",
			credentials: "same-origin",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data_uri })
		});
		let check_result = await check_response.json();

		// Alert User of any errors
		if (!check_result.success) {
			alert(`Error: Unable to check if the URI(${data_uri}) exists`);
		} else if (check_result.success && !check_result.exists) {
			alert(
				`Can not associate dataflow with data ${data_uri} as no columns or tables with this URI exist in the database`
			);
			input_field.value = "";
		} else {
			// Associate data to data flow
			dataflow.associated_data = data_uri;
		}
	}

	// Update diagram hierarchy
	save_current_graph(current_process_name);
	// Render personal data
	await render_personal_data_uses();

	// Show / Hide personal data uses info
	let dataflow_uses = personal_data_uses[dataflow_name];
	dataflow_uses
		? show_personal_data_uses_info(dataflow_uses)
		: hide_personal_data_uses_info();
}

async function query_personal_data_uses(dfd) {
	/**
	 * Retrieves details on the items in the DFD that use personal data
	 * @param {Object} dfd Serialize dfd
	 * @returns {Object} Details on which items use personal data, in form:
	 * 				{'item_name': {data_uri: , data_name:, personal_data_category: }
	 * 					null if an error occurred during request
	 */
	const data_uses_url = "/compliance/personal_data_uses";
	let response = await fetch(data_uses_url, {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ dfd })
	});
	let result = await response.json();

	// Alert users of errors
	if (!result.success) {
		alert("Error: Unable to retrieve data uses");
		return null;
	}
	return result.personal_data_uses;
}

async function render_personal_data_uses() {
	/**
	 * Highlights all items in the DFD that uses personal data
	 */
	let dfd = serialize_dfd(hierarchy);
	let query_result = await query_personal_data_uses(dfd);
	if (query_result) personal_data_uses = query_result;

	_add_personal_data_styles(hierarchy);
	editor.graph.refresh();
}

function _add_personal_data_styles(sub_hierarchy) {
	/**
	 * Recursive helper function that traverses through the DFD
	 * adding/removing personal data styles
	 * @param {Object} sub_hierarchy The current process being updated
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

		if (cell.item_type === "flow")
			cell_name in personal_data_uses
				? (cell.style = PERSONAL_DATA_EDGE_STYLE)
				: (cell.style = EDGE_STYLE);
	}
	// Recurs though children diagrams
	sub_hierarchy.children.forEach(child => _add_personal_data_styles(child));
}
