var streets = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
  }
);

var satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  }
);
var basemaps = {
  "Streets": streets,
  "Satellite": satellite

};


var map = L.map("map", {
  layers: [streets]
}).setView([54.5, -4], 6);

//Castle
var castles = L.markerClusterGroup({
  polygonOptions: {
    fillColor: '#fff',
    color: '#000',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5
  }
}).addTo(map);

//Stadium
var stadiums = L.markerClusterGroup({
  polygonOptions: {
    fillColor: '#fff',
    color: '#000',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5
  }
}).addTo(map);

//Mountain
var mountains = L.markerClusterGroup({
  polygonOptions: {
    fillColor: '#fff',
    color: '#000',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5
  }
}).addTo(map);

//Airport
var airports = L.markerClusterGroup({
  polygonOptions: {
    fillColor: '#fff',
    color: '#000',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5
  }
}).addTo(map);


var overlays = {
  "Castles": castles,
  "Stadiums": stadiums,
  "Mountain": mountains,
  "Airports": airports
}

var layerControl = L.control.layers(basemaps, overlays).addTo(map);



let countryNames = [];
let countries = [];
let countryIso = [];
let exchangeRates = {};
let currencyNames = {};

let currentCountry;

let listHTML, currentLat, currentLng, countryCode, selectedCountry, currentCountryLayer;

function Country(name, iso_a2, iso_a3, iso_n3, geoType, coordinates) {
  this.name = name;
  this.iso_a2 = iso_a2;
  this.iso_a3 = iso_a3;
  this.iso_n3 = iso_n3;
  this.coordinates = coordinates;
  this.geoType = geoType;
  this.lat;
  this.lng;




  //1.country information

  this.flag;
  this.capitalCity;
  this.timezone;
  this.timeOffset;
  this.population;
  this.area;
  this.languages;
  this.currencyCode;
  this.exchangeRate;


  //2. weather information

  this.weather_today = [];
  this.weather_day1 = [];
  this.weather_day2 = [];
  // 3. News information
  this.news_article1 = [];
  this.news_article2 = [];
  this.news_article3 = [];
  this.news_article4 = [];
  this.news_article5 = [];
  // 4. Wiki information
  this.wiki_info = [];
  // Marker Clusters
  this.marker_castles = [];
  this.marker_stadiums = [];
  this.marker_mountains = [];
  this.marker_airports = [];
  this.marker_capital = [];
}
//Showing and Hiding preloader

function showPreloader() {
  $('#preloader').show();
}
function hidePreloader() {
  $('#preloader').hide();
}
$(window).on('load', function () {
  showPreloader();
})
$(document).ready(() => {

  showPreloader();
  function addAllClustersToMap() {
    map.addLayer(castles);
    map.addLayer(stadiums);
    map.addLayer(mountains);
    map.addLayer(airports);
  }

  // Get the country information
  $.ajax({
    type: 'GET',
    url: "php/getCountryNames.php",
    data: {},
    dataType: 'json',
    success: function (data) {


      // ---------------- Create Country Objects ----------------
      const results = data["data"]
      
      for (let i = 0; i < results.length; i++) {
        let name = results[i]['name'];
        let iso_a2 = results[i]['code'];

        countryNames.push([name, iso_a2]);

      }


      //-------------------Generate Country List in HTML------------------
      listHTML += `<option value="Select..." selected>Select...</option>`;
      countryNames.sort();
      for (i = 0; i < countryNames.length; i++) {
        listHTML += `<option value="${countryNames[i][1]}">${countryNames[i][0]}</option>`
      }
      $('#country').html(listHTML);

      async function getSelectedCountryFeature(selectedCountryCode) {
        return new Promise((resolve, reject) => {
          $.ajax({
            type: 'POST',
            url: "php/getCountryFeatures.php",
            data: { selectedCountryCode: selectedCountryCode },
            dataType: 'json',
            success: function (selectedCountryFeatureData) {
              const selectedCountryFeature = selectedCountryFeatureData.data;
              resolve(selectedCountryFeature);
            },
            error: function (error) {
              console.error("Error fetching selected country feature: ", error);
              reject(error);
            }
          });
        });
      }

      //---------------To create boundaries on the map-----------------
      async function updateMap(selectedCountryISO) {
        if (currentCountryLayer) {
          map.removeLayer(currentCountryLayer);
        }
        castles.clearLayers();
        stadiums.clearLayers();
        mountains.clearLayers();
        airports.clearLayers();

        markerClusters = L.markerClusterGroup();


        map.eachLayer(function (layer) {
          if (layer !== streets) {
            map.removeLayer(layer);
          }
        })
        const selectedCountryFeature = await getSelectedCountryFeature(selectedCountryISO);
        currentCountryLayer = new L.geoJSON(selectedCountryFeature, {
          style: {
            color: 'grey',
            weight: 2,
            dashArray: '5, 5',
            fillColor: 'lightgrey',
            fillOpacity: 0.2,
          }
        }).addTo(map);
        addAllClustersToMap();
        map.fitBounds(currentCountryLayer.getBounds());
        addCountryMarkers(currentCountry);
        map.addLayer(markerClusters);
        hidePreloader();
      }
      //-------------------Find the users location and update the map-----------------
      function getLocation() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(showLocation, showError)

        } else {

        }

      }
      async function showLocation(position) {

        var currentLat = position.coords.latitude;
        var currentLng = position.coords.longitude;
        getCurrentCountry(currentLat, currentLng,);

        var currentCountryObj = await getCurrentCountry(currentLat, currentLng);
        currentCountry = currentCountryObj;
        $("#country").val(currentCountry.iso_a2).prop('selected', true);


        map.setView([currentLat, currentLng], 6);
        //------------Calling the functions to get the country informations-----------
        await getCountryInfo(currentCountry);
        await getTimeZone(currentCountry);
        await getWeatherInfo(currentCountry);
        await getNews(currentCountry);
        await getExchangeRate(currentCountry);
        await getWikiInfo(currentCountry);
        await getMapMarkers(currentCountry);
        await updateMap(currentCountry.iso_a2);
        await getCurrencyName();
        await getSelectedCountryFeature(currentCountry.iso_a2);

      }
      //---------------auto map generating if user refuses to provide location information-----
      async function showError(error) {
        alert("Unfortunately your location could not be determined... Defaulting your location to United Kingdom...");

        map.setView([54.5, -4], 6);
        currentCountry = new Country("United-Kingdom", "GB", "", "", "", [54.5, -4]);
        await getCurrentCountry(54.5, -4);
        await getCountryInfo(currentCountry);
        await getTimeZone(currentCountry);
        await getWeatherInfo(currentCountry);
        await getNews(currentCountry);
        await getExchangeRate(currentCountry);
        await getWikiInfo(currentCountry);
        await getMapMarkers(currentCountry);
        await updateMap(currentCountry.iso_a2);
        await getCurrencyName();
        await getSelectedCountryFeature(currentCountry.iso_a2);

      }

      getLocation();
      //-------------Map information to be updated with new country selection-------
      $('#country').change(async () => {
        var e = document.getElementById("country");
        var value = e.options[e.selectedIndex].value;
        var selectedCountry = e.options[e.selectedIndex].text;

        var selectedCountryObj = new Country(selectedCountry, value, "", "", "", []);
        currentCountry = selectedCountryObj;

        await findAvgCoords(currentCountry);
        await getCurrentCountry(currentCountry.coordinates[0], currentCountry.coordinates[1]);
        await getCountryInfo(currentCountry);
        await getTimeZone(currentCountry);
        await getWeatherInfo(currentCountry);
        await getNews(currentCountry);
        await getExchangeRate(currentCountry);
        await getWikiInfo(currentCountry);
        await getMapMarkers(currentCountry);
        await updateMap(currentCountry.iso_a2);
        await getCurrencyName();
        await getSelectedCountryFeature(currentCountry.iso_a2);

      });
    }

  });
});
//----------------Finding country Average coordinates to update the map with new country selection-----------------
async function findAvgCoords(country) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'GET',
      url: "js/json/countryInfo.json",
      data: {},
      dataType: 'json',
      success: function (data) {
        let alpha2 = country.iso_a2;
        for (let i = 0; i < data.length; i++) {
          let jsonalpha2 = data[i]['Alpha-2 code'];
          let latAvg = data[i]['Latitude'];
          let lngAvg = data[i]['Longitude'];
          if (alpha2 == jsonalpha2) {
            country.coordinates[0] = latAvg;
            country.coordinates[1] = lngAvg;
            map.setView([country.coordinates[0], country.coordinates[1]], 6);
            resolve();
          }
        }
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

async function getCurrentCountry(lat, lng) {
  // API Call to GeoNames to get users country info
  return new Promise(async (resolve, reject) => {
    await $.ajax({
      url: "php/getCurrentCountry.php",
      type: 'POST',
      dataType: 'json',
      data: {
        lat: lat,
        lng: lng,
      },
      success: function (result) {
        //console.log(JSON.stringify(result));

        if (result.status.name == "ok") {
          let countryName = result.data.countryName;
          let countryCode = result.data.countryCode;
          if (countryName === undefined) {
            countryName = "United Kingdom";
            countryCode = "GB";
          }

          const countryNameNoSpace = countryName.replace(/\s+/g, '-');//To avoid receiving response errors from APIs in country names that are not single words, eliminate the spaces

          const currentCountry = new Country(
            countryNameNoSpace,
            countryCode,
            "",
            "",
            "",
            [lat, lng],
          );

          resolve(currentCountry);
        } else {
          reject("Error: " + result.status.name);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(JSON.stringify(jqXHR));
        console.log(JSON.stringify(textStatus));
        console.log(JSON.stringify(errorThrown));
        reject("AJAX Error: " + textStatus);
      }
    });
  });
}
//-------------------------------------------------Get country information-----------------------
async function getCountryInfo(country) {

  await $.ajax({
    url: "php/getCountryInfo.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {

      //console.log(JSON.stringify(result));
      if (result.status.name == "ok") {
        country.area = result['data']['geonames']['0']['areaInSqKm'];
        country.capitalCity = result['data']['geonames']['0']['capital'];
        country.continent = result['data']['geonames']['0']['continentName'];
        country.currencyCode = result['data']['geonames']['0']['currencyCode'];
        country.languages = result['data']['geonames']['0']['languages'];
        country.population = result['data']['geonames']['0']['population'];
        country.iso_a3 = result['data']['geonames']['0']['isoAlpha3'];
      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
};
//--------------------------------------------------------Get Timezone informations-----------------------
async function getTimeZone(country) {

  await $.ajax({
    url: "php/getTimeZone.php",
    type: 'GET',
    dataType: 'json',
    data: {
      lat: country.coordinates[0],
      lng: country.coordinates[1],
    },
    success: function (result) {
      //console.log(JSON.stringify(result));
      if (result.status.name == "ok") {
        country.timezone = result['data']['timezoneId'];
        country.timeOffset = result['data']['dstOffset'];
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
};


//------------------------------------------Get Exchange Rates-------------------------
async function getExchangeRate(country) {
  await $.ajax({
    url: "php/getExchangeRate.php",
    type: 'GET',
    dataType: 'json',
    data: {},
    success: function (result) {
      //console.log(JSON.stringify(result));
      if (result.status.name == "ok") {

        var rates = result.data.rates;
        for (var currencyCode in rates) {
          var exchangeRate = rates[currencyCode];
          exchangeRates[currencyCode] = {
            currencyCode: currencyCode,
            exchangeRate: exchangeRate
          };
        }



      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
}

async function getCurrencyName() {
  await $.ajax({
    url: "php/getCurrencyName.php",
    type: 'GET',
    dataType: 'json',
    data: {},
    success: function (result) {
      //console.log(JSON.stringify(result));
      if (result.status.name == "ok") {

        currencyNames = result.data




      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
}



//-----------------------------------------------Get weather forecast-------------------------------
async function getWeatherInfo(country) {
  await $.ajax({
    url: "php/getWeatherInfo.php",
    type: 'GET',
    dataType: 'json',
    data: {
      capital: country.capitalCity,
    },
    success: function (result) {
      //console.log(JSON.stringify(result));            
      if (result.status.name == "ok") {

        //Today's weather forecast
        country.weather_today.push(result['data']['forecast']['forecastday']['0']['day']['maxtemp_c'],
          result['data']['forecast']['forecastday']['0']['day']['mintemp_c'],
          result['data']['forecast']['forecastday']['0']['day']['condition']['text'],
          result['data']['forecast']['forecastday']['0']['day']['condition']['icon'],
          result['data']['current']['last_updated']
        )
        //Day-1's Weather forecast
        country.weather_day1.push(result['data']['forecast']['forecastday']['1']['day']['maxtemp_c'],
          result['data']['forecast']['forecastday']['1']['day']['mintemp_c'],
          result['data']['forecast']['forecastday']['1']['date'],
          result['data']['forecast']['forecastday']['1']['day']['condition']['icon']
        )
        //Day-2's Weather forecast
        country.weather_day2.push(result['data']['forecast']['forecastday']['2']['day']['maxtemp_c'],
          result['data']['forecast']['forecastday']['2']['day']['mintemp_c'],
          result['data']['forecast']['forecastday']['2']['date'],
          result['data']['forecast']['forecastday']['2']['day']['condition']['icon']
        )
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
}
//--------------------------------------------------Get News------------------------------------ 
async function getNews(country) {
  await $.ajax({
    url: "php/getNews.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {
      //console.log(JSON.stringify(result));              
      if (result.status.name == "ok") {
        
        country.news_article1.push(result['data']['news']['0']['title'], result['data']['news']['0']['url'], result['data']['news']['0']['image']);

        country.news_article2.push(result['data']['news']['1']['title'], result['data']['news']['1']['url'], result['data']['news']['1']['image']);

        country.news_article3.push(result['data']['news']['2']['title'], result['data']['news']['2']['url'], result['data']['news']['2']['image']);

        country.news_article4.push(result['data']['news']['3']['title'], result['data']['news']['3']['url'], result['data']['news']['3']['image']);

        country.news_article5.push(result['data']['news']['4']['title'], result['data']['news']['4']['url'], result['data']['news']['4']['image']);
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
}

//---------------------------------------------------Get Wiki Info-------------------------------

async function getWikiInfo(country) {
  await $.ajax({
    url: "php/getWikiInfo.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.name,
    },
    success: function (result) {
      //console.log(JSON.stringify(result));              
      if (result.status.name == "ok") {
        const countryName1 = country.name.toLowerCase().replace(/-|\s/g, '');

        for (let i = 0; i < result['data']['geonames'].length; i++) {
          const countryWikiName = [];
          countryWikiName.push(result['data']['geonames'][i]['title'].toLowerCase().replace(/-|\s/g, ''));


          if (countryWikiName == countryName1) {
            country.wiki_info.push(result['data']['geonames'][i]['summary'], result['data']['geonames'][i]['wikipediaUrl'], result['data']['geonames'][i]['thumbnailImg']);
          }
        }

      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
}

//-----------------------------Get Map Markers--------------------------
async function getMapMarkers(country) {
  //---------------------------------------------Get Castles info from Geonames-------------------------------
  await $.ajax({
    url: "php/markerClusters/getMapCastles.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {
      //console.log(JSON.stringify(result))
      if (result.status.name == "ok") {

        for (let i = 0; i < result['data']['geonames'].length; i++) {

          country.marker_castles.push([result['data']['geonames'][i]['name'], result['data']['geonames'][i]['lat'], result['data']['geonames'][i]['lng']]);
        }

      }
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
  //---------------------------------------------Stadiums--------------------
  await $.ajax({
    url: "php/markerClusters/getStadiums.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {
      //console.log(JSON.stringify(result))
      if (result.status.name == "ok") {

        for (let i = 0; i < result['data']['geonames'].length; i++) {

          country.marker_stadiums.push([result['data']['geonames'][i]['name'], result['data']['geonames'][i]['lat'], result['data']['geonames'][i]['lng']]);
        }

      }
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
  //----------------------------Mountains-----------------------
  await $.ajax({
    url: "php/markerClusters/getMapMountains.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {
      //console.log(JSON.stringify(result))
      if (result.status.name == "ok") {

        for (let i = 0; i < result['data']['geonames'].length; i++) {

          country.marker_mountains.push([result['data']['geonames'][i]['name'], result['data']['geonames'][i]['lat'], result['data']['geonames'][i]['lng']]);
        }

      }
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
  //-----------------------------Airports----------------------------
  await $.ajax({
    url: "php/markerClusters/getMapAirports.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {
      //console.log(JSON.stringify(result))
      if (result.status.name == "ok") {

        for (let i = 0; i < result['data']['geonames'].length; i++) {

          country.marker_airports.push([result['data']['geonames'][i]['name'], result['data']['geonames'][i]['lat'], result['data']['geonames'][i]['lng']]);
        }

      }
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });
  await $.ajax({
    url: "php/getCapital.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country.iso_a2,
    },
    success: function (result) {
      //console.log(JSON.stringify(result));
      if (result.status.name == "ok") {
        country.marker_capital.push([result['data']['geonames']['0']['name'], result['data']['geonames']['0']['lat'], result['data']['geonames']['0']['lng']]);
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
    }
  });


}





/*--------------------------------------------------------------------------------------*/
// Country information Button (Modal-1)

L.easyButton({

  position: 'topleft',
  id: 'countryBtn',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Country Information',
    onClick: function (btn, map) {

      $("#countryInfoModal").modal("show");

      $(".close").click(function () {
        $("#countryInfoModal").modal('hide');
      });
      $('#Modal1Title').text(`${currentCountry.name} Information`);
      $('#countryFlag').attr('src', `https://flagcdn.com/h60/${currentCountry.iso_a2.toLowerCase()}.png`);
      $('#countryInfoName').text(currentCountry.name);
      $('#countryInfoCapital').text(currentCountry.capitalCity);
      $('#countryInfoTimezone').text(currentCountry.timezone);
      $('#countryInfoOffset').text(currentCountry.timeOffset);
      $('#countryInfoPopulation').text(`${(currentCountry.population / 1000000).toFixed(1)} M`);
      $('#countryInfoArea').text((Math.floor(currentCountry.area).toLocaleString('en-US')));
      $('#countryInfoLanguage').text(currentCountry.languages);
      $('#countryInfoCurrencyCode').text(currentCountry.currencyCode);

    }
  }, {
    icon: '&#x238C;',
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);

// ---------------------------------Wheather information Button (Modal-2)----------------------

L.easyButton({

  id: 'weatherBtn',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Weather Forecast',
    onClick: function (btn, map) {

      $("#weatherModal").modal("show");

      $(".close").click(function () {
        $("#weatherModal").modal('hide');
      });
      $('#weatherModalLabel').text(`${currentCountry.capitalCity}, ${currentCountry.name}`);
      $('#lastUpdated').text(Date.parse(currentCountry.weather_today[4]).toString("HH:mm, dS MMM"));
      //Today weather forecast
      $('#todayConditions').html(currentCountry.weather_today[2]);
      $('#todayIcon').attr("src", `${currentCountry.weather_today[3]}`);
      $('#todayMaxTemp').html(Math.round(currentCountry.weather_today[0]));
      $('#todayMinTemp').html(Math.round(currentCountry.weather_today[1]));
      //Day-1 weather forecast
      $('#day1Date').text(Date.parse(currentCountry.weather_day1[2]).toString("ddd dS"));
      $('#day1Icon').attr("src", `${currentCountry.weather_day1[3]}`);
      $('#day1MaxTemp').html(Math.round(currentCountry.weather_day1[0]));
      $('#day1MinTemp').html(Math.round(currentCountry.weather_day1[1]));
      //Day-2 weather forecast
      $('#day2Date').text(Date.parse(currentCountry.weather_day2[2]).toString("ddd dS"));
      $('#day2Icon').attr("src", `${currentCountry.weather_day2[3]}`);
      $('#day2MaxTemp').html(Math.round(currentCountry.weather_day2[0]));
      $('#day2MinTemp').html(Math.round(currentCountry.weather_day2[1]));


    }
  }, {
    icon: '&#x238C;',
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]


}).addTo(map);

/*--------------------------- News Info (Modal-3) --------------------------*/
L.easyButton({

  id: 'newsBtn',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Top Country News',
    onClick: function (btn, map) {
      if (currentCountry.news_article1[1]) {

        $("#newsModal").modal("show");

        $(".close").click(function () {
          $("#newsModal").modal('hide');
        });
        $('#newsModalTitle').html(`Latest Top News Stories for ${currentCountry.name}`);

        for (let i = 1; i <= 5; i++) {
          const article = currentCountry[`news_article${i}`];
          $(`#news${i}Link`).attr('href', article[1]);
          $(`#news${i}Link`).text(article[0]);
          $(`#news${i}Img`).attr('src', article[2]);
        }


      }
    }
  }, {
    icon: '&#x238C;',
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]


}).addTo(map);



/*--------------------------- Wikipedia Article Info (Modal-4)-------------------------*/
L.easyButton({

  position: 'topleft',
  id: 'wikiBtn',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Wikipedia Link',
    onClick: function (btn, map) {

      $("#wikiModal").modal("show");

      $(".close").click(function () {
        $("#wikiModal").modal('hide');
      });
      $('#wikipediaArticleHeader').html(currentCountry.name);
      $('#wikipediaArticleSummary').html(currentCountry.wiki_info[0]);
      $('#articleLink, #articleLink1').attr('href', `https://${currentCountry.wiki_info[1]}`);
      $('#wikiThumbnail').attr('src', currentCountry.wiki_info[2]);


    }
  }, {
    icon: '&#x238C;',
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);


/*--------------------- Currency Exchanger Info  (Modal-5)-----------------------------------------------*/
L.easyButton({

  position: 'topleft',
  id: 'exchangeBtn',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Country Exchange Rate',
    onClick: function (btn, map) {

      $("#exchangeModal").modal("show");

      $(".close").click(function () {
        $("#exchangeModal").modal('hide');
      });
      $('#exchangeRatesBaseAmountLabel').html(`${currencyNames[currentCountry.currencyCode]} (${currentCountry.currencyCode})`);

      var select = $('#exchangeCurrency');
      var baseAmountInput = $('#exchangeRatesBaseAmount');
      var targetAmountInput = $('#exchangeRatesTargetAmount');

      // USD selection as default
      select.append($('<option></option>').attr('value', 'USD').text('United States Dollar (USD)'));

      // Adding currency code to the selection list
      for (var currencyCode in currencyNames) {
        var currencyName = currencyNames[currencyCode];
        select.append($('<option></option>').attr('value', currencyCode).text(currencyName + ' (' + currencyCode + ')'));
      }
      var defaultBaseAmount = 10;
      baseAmountInput.val(defaultBaseAmount);
      var targetCurrency = select.val();
      var baseCurrency = currentCountry.currencyCode;
      var baseAmount = parseFloat(baseAmountInput.val()) || defaultBaseAmount;
      var targetExchangeRate = exchangeRates[targetCurrency].exchangeRate / exchangeRates[baseCurrency].exchangeRate;
      targetAmountInput.val((baseAmount * targetExchangeRate).toFixed(2));

      baseAmountInput.on('input', function () {
        var baseCurrency = currentCountry.currencyCode;
        var targetCurrency = $('#exchangeCurrency').val();
        var baseAmount = parseFloat(baseAmountInput.val()) || defaultBaseAmount;
        var targetExchangeRate = exchangeRates[targetCurrency].exchangeRate / exchangeRates[baseCurrency].exchangeRate;
        targetAmountInput.val((baseAmount * targetExchangeRate).toFixed(2));
      })
      baseAmountInput.on('change', function () {
        var baseCurrency = currentCountry.currencyCode;
        var targetCurrency = $('#exchangeCurrency').val();
        var baseAmount = parseFloat(baseAmountInput.val()) || defaultBaseAmount;

        var targetExchangeRate = exchangeRates[targetCurrency].exchangeRate / exchangeRates[baseCurrency].exchangeRate;
        targetAmountInput.val((baseAmount * targetExchangeRate).toFixed(2));
      })
      targetAmountInput.on('input', function () {
        var baseCurrency = currentCountry.currencyCode;
        var targetCurrency = $('#exchangeCurrency').val();
        var baseAmount = parseFloat(targetAmountInput.val()) || 0;
        var baseExchangeRate = exchangeRates[targetCurrency].exchangeRate * (exchangeRates[baseCurrency].exchangeRate);
        baseAmountInput.val((baseAmount * baseExchangeRate).toFixed(2));
      })
      targetAmountInput.on('change', function () {
        var baseCurrency = currentCountry.currencyCode;
        var targetCurrency = $('#exchangeCurrency').val();
        var baseAmount = parseFloat(targetAmountInput.val()) || 0;
        var baseExchangeRate = exchangeRates[targetCurrency].exchangeRate * (exchangeRates[baseCurrency].exchangeRate);
        baseAmountInput.val((baseAmount * baseExchangeRate).toFixed(2));
      })
      select.on('change', function () {
        var targetCurrency = $(this).val();
        var baseUSD = exchangeRates['USD'].exchangeRate
        var baseCurrency = currentCountry.currencyCode;
        var baseAmount = parseFloat(baseAmountInput.val()) || defaultBaseAmount;


        var targetExchangeRate = (baseUSD / exchangeRates[baseCurrency].exchangeRate) * exchangeRates[targetCurrency].exchangeRate;
        targetAmountInput.val((baseAmount * targetExchangeRate).toFixed(2));
        targetAmountInput.on('input', function () {
          var targetCurrency = $('#exchangeCurrency').val();
          var targetAmount = parseFloat(targetAmountInput.val()) || defaultBaseAmount;
          var baseCurrency = currentCountry.currencyCode;
          var baseExchangeRate = 1 / ((baseUSD / exchangeRates[baseCurrency].exchangeRate) * exchangeRates[targetCurrency].exchangeRate);
          baseAmountInput.val((targetAmount * baseExchangeRate).toFixed(2));
        });
        targetAmountInput.on('change', function () {
          var targetCurrency = $('#exchangeCurrency').val();
          var targetAmount = parseFloat(targetAmountInput.val()) || defaultBaseAmount;
          var baseCurrency = currentCountry.currencyCode;
          var baseExchangeRate = 1 / ((baseUSD / exchangeRates[baseCurrency].exchangeRate) * exchangeRates[targetCurrency].exchangeRate);
          baseAmountInput.val((targetAmount * baseExchangeRate).toFixed(2));
        });

      });


    }
  }, {
    icon: '&#x238C;',
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);



// Loading all markerClusters to the screen


function addCountryMarkers(country) {

  var castleIcon = L.ExtraMarkers.icon({
    prefix: 'fa-solid',
    icon: 'fa-chess-rook',
    iconColor: 'black',
    markerColor: 'white',
    shape: 'square'
  });
  var stadiumIcon = L.ExtraMarkers.icon({
    prefix: 'fa-solid',
    icon: 'fa-futbol',
    iconColor: 'black',
    markerColor: 'white',
    shape: 'square'
  });
  var mountainIcon = L.ExtraMarkers.icon({
    prefix: 'fa-solid',
    icon: 'fa-mountain',
    iconColor: 'black',
    markerColor: 'white',
    shape: 'square'
  });
  var airportIcon = L.ExtraMarkers.icon({
    prefix: 'fa',
    icon: 'fa-plane',
    iconColor: 'black',
    markerColor: 'white',
    shape: 'square'
  });


  for (i = 0; i < country.marker_castles.length; i++) {
    L.marker(new L.LatLng(country.marker_castles[i][1], country.marker_castles[i][2]), { icon: castleIcon }).bindTooltip(
      country.marker_castles[i][0], { direction: 'top', sticky: true }).addTo(castles);
  }

  for (i = 0; i < country.marker_stadiums.length; i++) {
    L.marker(new L.LatLng(country.marker_stadiums[i][1], country.marker_stadiums[i][2]), { icon: stadiumIcon }).bindTooltip(
      country.marker_stadiums[i][0], { direction: 'top', sticky: true }).addTo(stadiums);
  }

  for (i = 0; i < country.marker_mountains.length; i++) {
    L.marker(new L.LatLng(country.marker_mountains[i][1], country.marker_mountains[i][2]), { icon: mountainIcon }).bindTooltip(
      country.marker_mountains[i][0], { direction: 'top', sticky: true }).addTo(mountains);
  }

  for (i = 0; i < country.marker_airports.length; i++) {
    L.marker(new L.LatLng(country.marker_airports[i][1], country.marker_airports[i][2]), { icon: airportIcon }).bindTooltip(
      country.marker_airports[i][0], { direction: 'top', sticky: true }).addTo(airports);
  }


  map.addLayer(markerClusters);
}

