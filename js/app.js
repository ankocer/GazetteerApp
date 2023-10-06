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

var layerControl = L.control.layers(basemaps).addTo(map);


let countryNames = [];
let countries = [];
let countryIso = [];


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

  this.weather_current = [];

  // 3. News information
  this.news_article1 = [];
  this.news_article2 = [];
  this.news_article3 = [];
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
  // Get the country information
  $.ajax({
    type: 'GET',
    url: "js/json/countryBorders.json",
    data: {},
    dataType: 'json',
    success: function (data) {


      // ---------------- Create Country Objects ----------------
      const results = data["features"]

      for (let i = 0; i < results.length; i++) {

        let name = results[i]['properties']['name'];
        let iso_a2 = results[i]['properties']['iso_a2'];
        let iso_a3 = results[i]['properties']['iso_a3'];
        let iso_n3 = results[i]['properties']['iso_n3'];
        let geoType = results[i]['geometry']['type'];
        let coordinates = results[i]['geometry']['coordinates'];

        countryNames.push([name, iso_a2]);

        countryData = new Country(name, iso_a2, iso_a3, iso_n3, geoType, coordinates);
        countries.push(countryData);


      }

      //-------------------Generate Country List in HTML------------------
      listHTML += `<option value="Select..." selected>Select...</option>`;
      countryNames.sort();
      for (i = 0; i < countryNames.length; i++) {
        listHTML += `<option value="${countryNames[i][1]}">${countryNames[i][0]}</option>`
      }
      $('#country').html(listHTML);
      //---------------To create boundaries on the map-----------------
      async function updateMap(selectedCountryISO) {
        if (currentCountryLayer) {
          map.removeLayer(currentCountryLayer);
        }
        airportBtn.enable();
        castleBtn.enable();
        stadiumBtn.enable();
        mountainBtn.enable();
        markerClusters = L.markerClusterGroup();
        map.eachLayer(function (layer){
          if (layer !==streets){
            map.removeLayer(layer);
          }
        })
        currentCountryLayer = new L.geoJSON(data, {
          style: function (feature) {
            if (feature.properties.iso_a2 === selectedCountryISO) {
              return {
                color: 'grey',
                weight: 2,
                dashArray: '5, 5',
                fillColor: 'lightgrey',
                fillOpacity: 0.2,
              }
            } else {
              return {
                color: 'transparent',
              }
            }
          }
        }).addTo(map)
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

        console.log(currentCountry);

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
        country.exchangeRate = result['data']['rates'][country.currencyCode];
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
      country: country.iso_a2,

    },
    success: function (result) {
      //console.log(JSON.stringify(result));            
      if (result.status.name == "ok") {

        country.weather_current.push(result['data']['main']['temp'] - 273.15, result['data']['main']['feels_like'] - 273.15, result['data']['weather']['0']['description'], result['data']['main']['humidity'], result['data']['weather']['0']['icon']);

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


        country.news_article1.push(result['data']['articles']['0']['title'], result['data']['articles']['0']['url'], result['data']['articles']['0']['source']['name'], result['data']['articles']['0']['publishedAt']);

        country.news_article2.push(result['data']['articles']['1']['title'], result['data']['articles']['1']['url'], result['data']['articles']['1']['source']['name'], result['data']['articles']['1']['publishedAt']);

        country.news_article3.push(result['data']['articles']['2']['title'], result['data']['articles']['2']['url'], result['data']['articles']['2']['source']['name'], result['data']['articles']['2']['publishedAt'])

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
      $('#countryInfoArea').text(Math.floor(currentCountry.area));
      $('#countryInfoLanguage').text(currentCountry.languages);
      $('#countryInfoCurrencyCode').text(currentCountry.currencyCode);
      $('#countryInfoExchange').text(`1 USD = ${(currentCountry.exchangeRate).toFixed(2)} ${currentCountry.currencyCode}`);
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
      $('#Modal2Title').text(`Weather Forecast for ${currentCountry.capitalCity}`);
      $('#currentIcon').attr('src', `https://openweathermap.org/img/w/${currentCountry.weather_current[4]}.png`);
      $('#currentTemp').text(`${Math.floor(currentCountry.weather_current[0])}°C`);
      $('#currentFeelsLike').text(`${Math.floor(currentCountry.weather_current[1])}°C`);
      $('#currentConditions').text(currentCountry.weather_current[2].charAt(0).toUpperCase() + currentCountry.weather_current[2].slice(1));
      $('#currentHumidity').text(currentCountry.weather_current[3]);


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
        $('#Modal4Title').html(`Latest Top News Stories for ${currentCountry.name}`);

        for (let i = 1; i <= 3; i++) {
          const article = currentCountry[`news_article${i}`];
          $(`#article${i}Link`).attr('href', article[1]);
          $(`#article${i}Title`).text(article[0]);
          $(`#article${i}Source`).html(`<em>Source: ${article[2]}</em>`);
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
    title: 'Show Country Information',
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

var markerClusters = L.markerClusterGroup();

var MapIcon = L.Icon.extend({
  options: {
    iconSize: [25, 25],
    popupAnchor: [0, -200]
  }
});


/*------------------Castle Icon Button---------------------------*/
function castleDisable() {
  castleBtn.disable();
}
var castleBtn = L.easyButton({
  position: 'topright',
  id: 'castles',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Top 30 Castles',
    onClick: function (btn, map) {


      var castleIcon = new MapIcon({ iconUrl: 'icons/castle.png' });

      for (i = 0; i < currentCountry.marker_castles.length; i++) {

        var m = L.marker(new L.LatLng(currentCountry.marker_castles[i][1], currentCountry.marker_castles[i][2]), { icon: castleIcon }).bindPopup(`
                      <b>Castle Name:</b> ${currentCountry.marker_castles[i][0]} <br> 
                       
                  `);
        markerClusters.addLayer(m);

      }

      map.addLayer(markerClusters);

      castleDisable();
    }
  }, {
    icon: "none",
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);
//-------------------------------Stadiums Icon Button--------------
function stadiumDisable() {
  stadiumBtn.disable();
}
var stadiumBtn = L.easyButton({
  position: 'topright',
  id: 'stadiums',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Top 30 Stadiums',
    onClick: function (btn, map) {

      var stadiumIcon = new MapIcon({ iconUrl: 'icons/stadium.png' });

      for (i = 0; i < currentCountry.marker_stadiums.length; i++) {

        var m = L.marker(new L.LatLng(currentCountry.marker_stadiums[i][1], currentCountry.marker_stadiums[i][2]), { icon: stadiumIcon }).bindPopup(`
                      <b>Stadium Name:</b> ${currentCountry.marker_stadiums[i][0]} <br> 
                       
                  `);
        markerClusters.addLayer(m);

      }

      map.addLayer(markerClusters);

      stadiumDisable();
    }
  }, {
    icon: "none",
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);

//---------------------------Mountains Icon Button------------
function mountainDisable() {
  mountainBtn.disable();

}
var mountainBtn = L.easyButton({
  position: 'topright',
  id: 'mountains',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Top 30 Mountains',
    onClick: function (btn, map) {

      var mountainIcon = new MapIcon({ iconUrl: 'icons/mountain.png' });

      for (i = 0; i < currentCountry.marker_mountains.length; i++) {

        var m = L.marker(new L.LatLng(currentCountry.marker_mountains[i][1], currentCountry.marker_mountains[i][2]), { icon: mountainIcon }).bindPopup(`
                      <b>Mountain Name:</b> ${currentCountry.marker_mountains[i][0]} <br> 
                       
                  `);
        markerClusters.addLayer(m);

      }

      map.addLayer(markerClusters);

      mountainDisable();
    }
  }, {
    icon: "none",
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);
//---------------------------------Airport Icon Button------------------------
function airportDisable() {
  airportBtn.disable();
}
var airportBtn = L.easyButton({
  position: 'topright',
  id: 'airports',
  states: [{
    icon: "none",
    stateName: 'unchecked',
    title: 'Show Top 30 Airports',
    onClick: function (btn, map) {

      var airportIcon = new MapIcon({ iconUrl: 'icons/airport.png' });

      for (i = 0; i < currentCountry.marker_airports.length; i++) {

        var m = L.marker(new L.LatLng(currentCountry.marker_airports[i][1], currentCountry.marker_airports[i][2]), { icon: airportIcon }).bindPopup(`
                      <b>Airport Name:</b> ${currentCountry.marker_airports[i][0]} <br> 
                       
                  `);
        markerClusters.addLayer(m);

      }

      map.addLayer(markerClusters);

      airportDisable();
    }
  }, {
    icon: "none",
    stateName: 'checked',
    onClick: function (btn, map) {
      btn.state('unchecked');
    }
  }]
}).addTo(map);

