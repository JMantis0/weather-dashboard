$(document).ready(function () {

	//  Assign local vars.
	let cityInput = $("#searchInput");
	let searchBtn = $("#searchBtn");
	let history = $(".history");
	let currentDay = $("#currentDay")
	let fiveDay = $("#fiveDay");
	let apiKey = "9c651b783881ed4ccbd7fb3242a0070e";
	let storedSearches = []
	
	//  Function initialize is called on page open or refresh.
	//  Renders list of history buttons from localStorage.
	function initialize() {
		
		if(localStorage.getItem("searches") !== null) {

			storedSearches = JSON.parse(localStorage.getItem("searches"));

			for(let i = 0; i < storedSearches.length; i++) {

				let newRow = $(`<div class='row histRow'></div>`)
				let histBtn = $(`<button class='btn btn-outline-secondary histBtn ${storedSearches[i]}' id='${storedSearches[i]}' type='button'>${storedSearches[i]}</button>`);
				let delBtn = $(`<span class="btn del">&times;</span>`);
				newRow.append(histBtn);
				histBtn.append(delBtn);
				history.prepend(newRow);

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

		$(".histBtn").click(callbackCoordinates);
		searchBtn.click(callbackCoordinates);

		$(".del").click(function(event) {

			event.stopPropagation();
			storedSearches = storedSearches.filter(item => item !== $(this).parents(".histBtn").attr("id"));
			localStorage.setItem("searches", JSON.stringify(storedSearches));
			$(this).parents(".histRow").remove();
			
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
				
				let newRow = $(`<div class='row histRow'></div>`)
				let histBtn = $(`<button class='btn btn-outline-secondary histBtn ${currentWeatherData.name}' id='${currentWeatherData.name}' type='button'>${currentWeatherData.name}</button>`);
				let delBtn = $(`<span class="btn del">&times;</span>`);
				newRow.append(histBtn);
				histBtn.append(delBtn);
				history.prepend(newRow);
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
			
			$('.added').remove();			

			//  insert currentWeatherData
			$(`<div class='col-auto added animated fadeIn' id='currentCol'>
		
				<h3>
					${currentWeatherData.name} 
				</h3>

				<h5>
					${moment().utc().add(currentWeatherData.timezone, "s").format("dddd M/D/YY h:mm a")}
				<h5>

				<h5>
					Temperature: ${Math.round(currentWeatherData.main.temp)} F
				</h5>

				<h5>	
					Humidity: ${currentWeatherData.main.humidity}%
				</h5>

				<h5>
					Wind Speed: ${currentWeatherData.wind.speed} MPH
				</h5>

				<h5 id='uvIndex'>
					UV Index: 
				</h5>

			</div>`).appendTo(currentDay);
		
			// Insert UV data.
			$(`<div id ='uvBlurb' style='display: inline;' >${oneCallData.current.uvi}</div>`).appendTo($("#uvIndex"));

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
			$(`<div id='currentIcon' class='added col-auto animated fadeIn'>
				<img  src=` + "https://openweathermap.org/img/wn/" + `${currentWeatherData.weather[0].icon}@2x.png>
			</div>`).appendTo(currentDay);

			//  Add 5 day forecast data to HTML
			for(let i=1; i < 6; i++) {				
				
				$(`<div class='col forecast added'>

					<div class='animated fadeIn row'>
						<h4>${moment.unix(oneCallData.daily[i].dt).format("dd M-D")}</h4>
					</div>

					<div class='animated fadeIn row'>
						<img src=` + "https://openweathermap.org/img/wn/" + `${oneCallData.daily[i].weather[0].icon}@2x.png>
					</div>

					<div class='animated fadeIn row high'>
						${Math.round(oneCallData.daily[i].temp.max)} °F
					</div>

					<div class='animated fadeIn row low'>
						${Math.round(oneCallData.daily[i].temp.min)} °F
					</div>

					<div class='animated fadeIn row'>
						<i class="fas fa-tint low"></i>&nbsp${oneCallData.daily[i].humidity} %
					</div>

				</div>`).appendTo(fiveDay);

			}

			assignListeners();

		});

	}

	initialize();
	
});