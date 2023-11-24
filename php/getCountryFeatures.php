<?php
$executionStartTime = microtime(true);

$countryData = json_decode(file_get_contents("../js/json/countryBorders.json"), true);

$selectedCountryCode = $_POST['selectedCountryCode'];

$selectedCountryFeature = null;

foreach ($countryData['features'] as $feature) {
    if ($feature["properties"]['iso_a2'] === $selectedCountryCode) {
        $selectedCountryFeature = $feature;
        break;
    }
}

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['executedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $selectedCountryFeature;

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
?>
