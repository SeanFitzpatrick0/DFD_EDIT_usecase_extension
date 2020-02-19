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

	// Update data association
	let input_field = document.getElementById("data_association_input");
	let data_uri = input_field.value;

	// Remove associated data attribute if empty input
	if (data_uri.length === 0) {
		delete dataflow.associated_data;
		return;
	}

	// Check if data URI exists
	const check_exists_uri = "/compliance/data_uri_exists";
	let check_response = await fetch(check_exists_uri, {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ data_uri })
	});
	let check_result = await check_response.json();

	// Alert User of any errors
	if (!check_result.success) {
		alert(`Error: Unable to check if the URI(${data_uri}) exists`);
		return;
	} else if (check_result.success && !check_result.exists) {
		alert(
			`Can not associate dataflow with data ${data_uri} as no columns or tables with this URI exist in the database`
		);
		input_field.value = "";
		return;
	}

	// Associate data to data flow
	dataflow.associated_data = data_uri;
}

function make_personal_data_describe_query() {
	/**
	 * TODO DOC
	 */
}

function render_personal_data() {
	/**
	 * TODO
	 */
}
