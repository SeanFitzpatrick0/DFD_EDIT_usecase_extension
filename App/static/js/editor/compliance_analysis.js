function show_data_association_menu(dataflow_name) {
	/**
	 * Shows the data association menu and set the title and input field for the data flow
	 * @param {String} dataflow_name The name of the selected data flow
	 */
	// Set data flow title
	document.getElementById(
		"data_association_menu_title"
	).innerText = dataflow_name;

	// Set existing associated data URI if exists
	let input_field = document.getElementById("data_association_input");
	let dataflow = find_cell_in_graph(
		editor.graph.getModel(),
		dataflow_name,
		"flow"
	);
	input_field.value = dataflow.associated_data
		? dataflow.associated_data
		: "";

	// Show table
	document.getElementById("data_association_menu").style.display = "block";
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
	render_personal_data_uses();
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
	return result;
}

async function render_personal_data_uses() {
	/**
	 * TODO
	 */
	let dfd = serialize_dfd(hierarchy);
	let personal_data_uses = await query_personal_data_uses(dfd);
	console.log("render personal data uses");
}
