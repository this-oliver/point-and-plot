const form = document.getElementById("image-form");
const formInput = form.querySelector("input[type=file]");
const formSubmitButton = form.querySelector("button[type=submit]");
const svg = document.getElementById("svg");
const svgGroup = document.getElementById("svg-group");
const coordGroup = document.getElementById("coords");
const exportButton = document.getElementById("export");
const resetCanvasButton = document.getElementById("reset-canvas");

let counter = 0;
let coords = [];

/**
 * Adds coordinates to the list and increments the counter.
 *
 * @param {number} id - The id of the coordinate.
 * @param {number} x - The x coordinate of the point.
 * @param {number} y - The y coordinate of the point.
 *
 * @returns {void}
 */
function addCoords(id, x, y) {
	coords.push({ id, x, y });

	const coordsElement = document.createElement("div");
	coordsElement.classList.add("p-4", "border", "border-black");
	coordsElement.textContent = `id: ${id}, x: ${x}, y: ${y}`;
	coordGroup.appendChild(coordsElement);

	counter++;
	document.getElementById("count").textContent = counter;
}

/**
 * Exports the coordinates to the web console and downloads a JSON file
 * containing the coordinates.
 *
 * @returns {void}
 */
function exportCoords() {
	console.log(coords);

	// prompt user to download file
	const promptMessage =
		"Coordinates have been logged to the console. Do you want to download the coordinates as a JSON file?";
	if (confirm(promptMessage)) {
		// download file
		const data = JSON.stringify(coords, null, 2);
		const blob = new Blob([data], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "point-and-click-coordinates.json";
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
}

/**
 * Resets the coordinates and counter.
 *
 * @returns {void}
 */
function resetCoords() {
	coords = [];
	counter = 0;
	coordGroup.innerHTML = "";
	document.getElementById("count").textContent = counter;
}

function resetImage() {
	// hide canvas and show form
	document.getElementById("canvas").classList.add("hidden");
	document.getElementById("canvas-form").classList.remove("hidden");

	// activate submit button
	formSubmitButton.disabled = false;
}

/**
 * This function creates a circle and text element on the SVG canvas
 * with the given id, x, and y coordinates to represent a pointer.
 *
 * @param {number} id - The id of the circle.
 * @param {number} x - The x coordinate of the circle.
 * @param {number} y - The y coordinate of the circle.
 *
 * @returns {Object} - The circle and text elements.
 */
function createPointer(id, x, y) {
	const DEFAULT_RADIUS = 50;
	const DEFAULT_TEXT_SIZE = "3em";
	const DEFAULT_FILL = "red";

	// set config
	const config = {
		fill: DEFAULT_FILL,
		radius: DEFAULT_RADIUS,
		textSize: DEFAULT_TEXT_SIZE,
	};

	// create circle element
	let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttribute("cx", x);
	circle.setAttribute("cy", y);
	circle.setAttribute("r", config.radius);
	circle.setAttribute("fill", config.fill);
	circle.setAttribute("id", id);

	// depending on the size of the id, padding might be required
	// to center the text in the circle
	const idCharLength = id.toString().length;
	const padding = idCharLength > 1 ? 0 : 10;

	// create text element
	const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	text.setAttribute("x", x - 25 + padding);
	text.setAttribute("y", y + 15);
	text.setAttribute("fill", "white");
	text.style.fontSize = config.textSize;
	text.textContent = id + 1;

	return { circle, text };
}

/**
 * This function processes the coordinates of a mouse event and performs the following actions:
 * 1. Retrieves the x and y coordinates of the mouse event.
 * 2. Transforms the coordinates using the inverse of the screen transformation matrix of the map SVG.
 * 3. Creates a temporary circle element on the map SVG at the transformed coordinates.
 * 4. Waits for 3 seconds and then prompts the user if they want to add the point.
 * 4.1. If the user accepts then the coordinate is added, the counter is incremented, and the circle is removed.
 * 4.2 If the user cancels then the circle is removed.
 *
 * @param {MouseEvent} e - The mouse event object.
 *
 * @returns {void}
 */
function processCoords(e) {
	// get points
	let point = svg.createSVGPoint();
	point.x = e.clientX;
	point.y = e.clientY;
	let position = point.matrixTransform(svg.getScreenCTM().inverse());

	// temporarily add a circle to the map
	let { circle, text } = createPointer(counter, position.x, position.y);
	svgGroup.appendChild(circle);
	svgGroup.appendChild(text);

	// wait 3 seconds and then prompt user if they want to add the point
	setTimeout(() => {
		if (confirm(`Add point at ${position.x}, ${position.y}?`)) {
			addCoords(counter, position.x, position.y);
		} else {
			circle.remove();
			text.remove();
		}
	}, 500);
}

/**
 * Handles the form submission event by performing the following actions:
 *
 * 1. Creates an image element from the uploaded file and appends it to the SVG group element.
 * 2. Updates the viewbox of the SVG element to match the dimensions of the image.
 * 3. Hides the form and shows the canvas.
 *
 * @param {Event} e - The form submission event object.
 *
 * @returns {void}
 */
function handleImageSubmit(e) {
	e.preventDefault();
	const form = document.getElementById("image-form");
	const file = form.querySelector("input[type=file]").files[0];
	const reader = new FileReader();

	reader.onload = function (e) {
		const targetImg = new Image();
		targetImg.src = e.target.result;
		targetImg.onload = function () {
			// update svg viewbox
			svg.setAttribute("viewBox", `0 0 ${targetImg.width} ${targetImg.height}`);

			// add image element
			const image = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"image"
			);
			image.setAttribute("href", targetImg.src);
			image.setAttribute("width", targetImg.width);
			image.setAttribute("height", targetImg.height);
			svgGroup.appendChild(image);

			// show canvas and hide form
			document.getElementById("canvas-form").classList.add("hidden");
			document.getElementById("canvas").classList.remove("hidden");
		};
	};

	reader.readAsDataURL(file);
}

/**
 * Toggles the active state of the submit button based on the presence of a file.
 *
 * @returns {void}
 */
function handleSubmitButton() {
	const formHasFile = formInput.files.length > 0;
	formSubmitButton.disabled = !formHasFile;
}

// setup
exportButton.addEventListener("click", exportCoords);
resetCanvasButton.addEventListener("click", () => {
	resetImage();
	resetCoords();
});
form.addEventListener("submit", handleImageSubmit);
formInput.addEventListener("change", handleSubmitButton);
svg.addEventListener("click", processCoords);
