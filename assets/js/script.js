$(document).ready(function () {

	//  Assign local vars.
	let cityInput = $("#searchInput");
	let searchBtn = $("#searchBtn");
	let history = $(".history");
	let currentDay = $("#currentDay")
	let fiveDay = $("#fiveDay");
	let apiKey = "9c651b783881ed4ccbd7fb3242a0070e";
	let storedSearches = [];
	let observer = new MutationObserver(callback);
	observer.observe($("#toggleBtn")[0], {attributes:true});
	
	function callback(mutations) {

		for(let mutation of mutations) {

			if (mutation.type === 'attributes') {
				console.log("Togglebutton Attribute Mutation Detected")

				if ($("#toggleBtn").attr("aria-expanded") == "false") {

					$("#toggleBtn").text("> Search Weather <");

				}
				else if ($("#toggleBtn").attr("aria-expanded") == "true") {

					$("#toggleBtn").text("Close Search");

				}

			}

		}
		
	}
	
	
	//  Function initialize is called on page open or refresh.
	//  Renders list of history buttons from localStorage.
	function initialize() {
		
		if(localStorage.getItem("searches") !== null) {

			storedSearches = JSON.parse(localStorage.getItem("searches"));

			for(let i = 0; i < storedSearches.length; i++) {

				let newCol = $(`<div class='col-md-3 col-sm-4 col-6 histCol'></div>`)
				let histBtn = $(`<button class='btn btn-outline-secondary histBtn ${storedSearches[i]}' id='${storedSearches[i]}' type='button'>${storedSearches[i]}</button>`);
				let delBtn = $(`<span class="btn del">&times;</span>`);
				newCol.append(histBtn);
				histBtn.append(delBtn);
				history.prepend(newCol);

			}
			
		}

		assignListeners();
		history.find(".histBtn").first().click();

	}

	// Function assignListeners assigns event listeners.
	function assignListeners() {

		$(".histBtn").off();
		cityInput.off();
		$(".del").off();
		searchBtn.off();
		$("#toggleBtn").off();

		$(".histBtn").click(callbackCoordinates);
		searchBtn.click(callbackCoordinates);

		$(".del").click(function(event) {

			event.stopPropagation();
			storedSearches = storedSearches.filter(item => item !== $(this).parents(".histBtn").attr("id"));
			localStorage.setItem("searches", JSON.stringify(storedSearches));
			$(this).parents(".history .histCol").remove();
			
		});		

		cityInput.keydown(function(event) {

			if (event.keyCode === 13) {

				searchBtn.click();

			}

		});

	}

	//  Function callbackCoordinates calls OpenWeatherMaps API for current weather data.
	function callbackCoordinates() {	
	

		let city;

		if($(this).hasClass("searchBtn")) {

			city = cityInput.val();
		}
		if($(this).hasClass("histBtn")) {

			city = $(this).attr("id");

		}

		
		let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;

	
		$.ajax({

			url: queryURL,
			method: "GET"

		}).then(function(currentWeatherData) {

			//  Assign data attributes to history button for latitude and longitude
			//  Append to history section in HTML
			if(!$(".histBtn").hasClass(currentWeatherData.name)) {

				storedSearches.push(currentWeatherData.name);
				localStorage.setItem("searches", JSON.stringify(storedSearches));	
				let newCol = $(`<div class='col-md-3 col-sm-4 col-6 histCol'></div>`);
				let histBtn = $(`<button class='btn btn-outline-secondary histBtn inline ${currentWeatherData.name}' id='${currentWeatherData.name}' type='button'>${currentWeatherData.name}</button>`);
				let delBtn = $(`<span class="btn del">&times;</span>`);
				newCol.append(histBtn);
				histBtn.append(delBtn);
				history.prepend(newCol);

			}
			else {

				storedSearches = storedSearches.filter(item => item !== currentWeatherData.name);
				storedSearches.push(currentWeatherData.name);	
				localStorage.setItem("searches", JSON.stringify(storedSearches));
				let existingBtn = $(`[id ='${currentWeatherData.name}']`);
				existingBtn.parents(".histCol").remove();
				let newCol = $(`<div class='col-md-3 col-sm-4  col-6 histCol'></div>`);
				newCol.append(existingBtn);
				history.prepend(newCol);
			}

			callbackOneCallAPI(currentWeatherData);

		});

	}


	//  Function callbackOneCallAPI calls another OpenWeatherMaps API for 5 day forecast data.
	//  New divs are created with jQuery, populated with data, and rendered to HTML.
	function callbackOneCallAPI(currentWeatherData) {

		
		$.ajax({

			url: `https://api.openweathermap.org/data/2.5/onecall?lat=${currentWeatherData.coord.lat}&lon=${currentWeatherData.coord.lon}&exclude=hourly&appid=${apiKey}&units=imperial`,
			method: "GET"

		}).then(function(oneCallData) {
			console.log(currentWeatherData)
			console.log(oneCallData)
			$('.added').remove();			

			//  insert currentWeatherData
			$(`<div class='added col-3><div class='col-sm-8 added animated fadeIn' id='currentCol'>
			
				<h3 class='row'>
					${currentWeatherData.name} Today
				</h3>

				<h5>
					<p class='row time'>${moment().utc().add(currentWeatherData.timezone, "s").format("dddd M/D/YY h:mm a")}</p>
				<h5>

				<h5 class='row'>
					 <div class='col high'>High: ${Math.round(oneCallData.daily[0].temp.max)} °F</div> <div class='col low'>Low: ${Math.round(oneCallData.daily[0].temp.min)} °F</div>
				</h5>

				<h5 class='humi center'>	
					<p class='row justify-content-center'><i class="fas fa-tint low"></i>Humidity: ${currentWeatherData.main.humidity}%</p>
				</h5>

				<h5>
					<p class='row wind'>Wind Speed: ${currentWeatherData.wind.speed} MPH</p>
				</h5>

				<h5 id='uvIndex'>
					<p class='row justify-content-center burn'>UV Index:</p> 
				</h5>

			</div>`).appendTo(currentDay);
		
			// Insert UV data.
			$(`<div id ='uvBlurb' style='display: inline;' >${oneCallData.current.uvi}</div>`).appendTo($(".burn"));

			//  Color uvBlurb according to UV Risk.
			let uvBlurb = $("#uvBlurb");		
			let uvRisk = oneCallData.current.uvi;
			if (uvRisk <= 3) {
				uvBlurb.addClass("lowUV");
			}
			else if (uvRisk <= 6) {
				uvBlurb.addClass("moderateUV");
			}
			else if (uvRisk <= 8) {
				uvBlurb.addClass("highUV");
			}
			else if (uvRisk <=11) {
				uvBlurb.addClass("veryHighUV");
			}
			else {
				uvBlurb.addClass("extremeUV");
			}

			//  Insert currentWeatherData Icon 
			$(`<div id='currentIcon' class='added col-md-2 animated fadeIn'>
				<img  src=` + "https://openweathermap.org/img/wn/" + `${currentWeatherData.weather[0].icon}@2x.png>
			</div>`).appendTo(currentDay);

			//  Add 5 day forecast data to HTML
			for(let i=1; i < 6; i++) {				
				
				$(`<div class='col-lg col-md-4 col-sm-6 col-6 forecast added'>

					<div class='animated fadeIn row'>
						<h4>${moment.unix(oneCallData.daily[i].dt).format("dd M-D")}</h4>
					</div>

					<div class='animated fadeIn row'>
						<img src=` + "https://openweathermap.org/img/wn/" + `${oneCallData.daily[i].weather[0].icon}@2x.png>
					</div>

					<div class='animated fadeIn row'>
						<p class='high'>${Math.round(oneCallData.daily[i].temp.max)} °F</p>
					</div>

					<div class='animated fadeIn row'>
						<p class='low'>${Math.round(oneCallData.daily[i].temp.min)} °F</p>
					</div>

					<div class='animated fadeIn row humi'>
						<p><i class="fas fa-tint low"></i>&nbsp${oneCallData.daily[i].humidity} %</p>
					</div>

				</div>`).appendTo(fiveDay);

				if(i == 4) {
					$(".forecast:last").addClass("offset-md-2 offset-lg-0")
				}
				if(i == 5) {
					$(".forecast:last").addClass("offset-3 offset-sm-3 offset-md-0 offset-lg-0")
				}

			}

			assignListeners();
			cityInput.val("");

		});

	}

	initialize();
	
});