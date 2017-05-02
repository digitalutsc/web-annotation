<?php
/**
 * @file
 * Handles the hookmenu calls from the web annotation module
 */

require_once('AnnotationConstants.php');
require_once('Annotation.php');
require_once('AnnotationContainer.php');

//ToDo: Need to validate input vars

function createAnnotation(){
    $targetObjectID = null;
    $json = '';
    try
    {
        parse_str(file_get_contents("php://input"), $postVars);
        $json = isset($postVars['json']) ? $postVars['json'] : '';
        $targetObjectID = isset($postVars['targetPid']) ? $postVars['targetPid'] : '';

        if($targetObjectID != '') {
            $annotationData =  isset($_POST['annotationData']) ? $_POST['annotationData'] : '';
            $annotationMetadata =  isset($_POST['metadata']) ? $_POST['metadata'] : '';

            $oAnnotationContainer = new AnnotationContainer();
            $output = $oAnnotationContainer->createAnnotation($targetObjectID, $annotationData, $annotationMetadata);
        } else if($json != '') {
            createAnnotationForVideo($json);
            return;
        } else {
            throw new Exception("Delete request not valid.");
        }
    } catch(Exception $e) {
        watchdog(AnnotationConstants::MODULE_NAME, 'Error in createAnnotation: %t', array('%t' => $e->getMessage()), WATCHDOG_ERROR);
        $output = array('status' => "Fail", "msg"=> "Failed to create annotation for targetObjectID " . $targetObjectID);
        $output = json_encode($output);
    }

    drupal_json_output($output);
    drupal_exit();
}

function createAnnotationForVideo($json){
    $annotationData = json_decode($json, true);

    // Set annotationData - required by json-ld
    $uri = $annotationData["uri"];
    $annotationData["context"] = $uri;

    // Set Metadata - required by json-ld
    $created = $annotationData["created"];
    $user = $annotationData["user"];
    $annotationMetadata["created"] = $created;
    $annotationMetadata["creator"] = $user;

    $targetPID = substr($uri, strrpos($uri, '/') + 1);
    $oAnnotationContainer = new AnnotationContainer();
    $output = $oAnnotationContainer->createAnnotation($targetPID, $annotationData, $annotationMetadata);

    $annotationData = json_decode($output, true);

    $arrResult["rows"] = array();
    array_push(  $arrResult["rows"], $annotationData);
    $arrResult["total"] = 1;

    $output = json_encode($arrResult);

    watchdog(AnnotationConstants::MODULE_NAME, "Video Annotations - createAnnotationForVideo " . $output);

    echo $output;
    drupal_exit();
}

function searchAnnotations(){
    $targetObjectURI = isset($_GET['uri']) ? $_GET['uri'] : '';
    $targetObjectID = substr($targetObjectURI, strrpos($targetObjectURI, '/') + 1);

    $oAnnotationContainer = new AnnotationContainer();
    $AnnotationContainerPID = $oAnnotationContainer->getAnnotationContainerPID($targetObjectID);
    $output = $oAnnotationContainer->getAnnotationContainer($targetObjectID);

    $annotationData = json_decode($output, true);
    $items = $annotationData["first"]["items"];

    $arrResult["rows"] = array();

    for($i = 0; $i < count($items); $i++) {
        $items[$i]["annotationContainerID"] = $AnnotationContainerPID;
        array_push(  $arrResult["rows"], $items[$i]);
    }

    $arrResult["total"] = count($items);
    $output = json_encode($arrResult);

    watchdog(AnnotationConstants::MODULE_NAME, "Video Annotations - searchForAnnotations " . $output);

    echo $output;
    drupal_exit();
}

function getAnnotationContainer(){
    $targetObjectID = null;

    try {
        $targetObjectID = isset($_GET['targetPid']) ? $_GET['targetPid'] : '';

        $oAnnotationContainer = new AnnotationContainer();
        $output = $oAnnotationContainer->getAnnotationContainer($targetObjectID);
    } catch(Exception $e)
    {
        watchdog(AnnotationConstants::MODULE_NAME, 'Error in getAnnotationContainer: %t', array('%t' => $e->getMessage()), WATCHDOG_ERROR);
        $output = array('status' => "failure", "msg"=> "Failed to get annotationContainer for targetObjectID " . $targetObjectID);
        $output = json_encode($output);
    }

    drupal_json_output($output);
    drupal_exit();
}

function updateAnnotation(){
    $annotationPID = null;

    try {
        parse_str(file_get_contents("php://input"), $putVars);
        $annotationID = isset($putVars['annotationPID'])  ? $putVars['annotationPID'] : '';
        $json = isset($putVars['json']) ? $putVars['json'] : '';

        if($annotationID != '') {
            $annotationData = $putVars['annotationData'] ? $putVars['annotationData'] : '';
            $annotationMetadata = $putVars['metadata'] ? $putVars['metadata'] : '';
            $ETag = $_SERVER['HTTP_IF_MATCH'];
        } else if($json != '') {
            $annotationData = json_decode($json, true);
            // Set annotationData - required by json-ld
            $uri = $annotationData["uri"];
            $annotationData["context"] = $uri;

            // Set Metadata - required by json-ld
            $created = $annotationData["created"];
            $user = $annotationData["user"];
            $author = $annotationData["author"];
            $annotationMetadata["created"] = $created;
            $annotationMetadata["creator"] = $user;
            $annotationMetadata["author"] = $author;

            $annotationID  = $annotationData["pid"];
            $ETag = $annotationData["checksum"];

            // Immediately after creating an annotation, if the user edits it
            // It comes in with additional data fields that needs to be cleanup.
            if (array_key_exists('rows', $annotationData)) {
              unset($annotationData["total"]);
              unset($annotationData["rows"]);
            }
            unset($annotationData["annotationContainerID"]);
            unset($annotationData["checksum"]);
        } else {
            throw new Exception("Delete request not valid.");
        }

        $oAnnotation = new Annotation(null);
        $bConflict = $oAnnotation->checkEditConflict($annotationID, $ETag);

        // If conflict exists, return message
        if($bConflict == false){
            $output = array('status' => "conflict", "data"=> "The original datastream has been changed for " . $annotationID);
            $output = json_encode($output);
        } else {
            $output = $oAnnotation->updateAnnotation($annotationData, $annotationMetadata);
            $output = array('status' => "success", "data"=> $output);
            $output = json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        }

    } catch(Exception $e) {
        watchdog(AnnotationConstants::MODULE_NAME, 'Error in updateAnnotation: %t', array('%t' => $e->getMessage()), WATCHDOG_ERROR);
        $output = array('status' => "failure", "data"=> "Failed to updateAnnotation with annotation with PID " . $annotationID);
        $output = json_encode($output);
    }

    echo $output;
    drupal_exit();
}

function deleteAnnotation(){
    $annotationID = null;
    try {
        parse_str(file_get_contents("php://input"), $deleteVars);
        $annotationID = isset($deleteVars['annotationID']) ? $deleteVars['annotationID'] : '';
        $json = isset($deleteVars['json']) ? $deleteVars['json'] : '';

        if($annotationID != '') {
            $annotationContainerID = $deleteVars['annotationContainerID'] ? $deleteVars['annotationContainerID'] : '';
            $ETag = $_SERVER['HTTP_IF_MATCH'];
        } else if($json != '') {
            $annotationData = json_decode($json, true);
            $annotationID  = $annotationData["pid"];
            $annotationContainerID  = $annotationData["annotationContainerID"];
            $ETag = $annotationData["checksum"];
        } else {
            throw new Exception("Delete request not valid.");
        }

        // Delete the object
        $oAnnotation = new Annotation(null);
        $bConflict = $oAnnotation->checkEditConflict($annotationID, $ETag);

        // If conflict exists, return message
        if($bConflict == false){
            $output = array('status' => "conflict", "data"=> "The original datastream has been changed for " . $annotationID);
            $output = json_encode($output);
        } else {
            $oAnnotationContainer = new AnnotationContainer();
            $output = $oAnnotationContainer->deleteAnnotation($annotationContainerID, $annotationID);
        }
    } catch(Exception $e)  {
        watchdog(AnnotationConstants::MODULE_NAME, 'Error in deleteAnnotation: %t', array('%t' => $e->getMessage()), WATCHDOG_ERROR);
        $output = array('status' => "failure", "data"=> "Failed to deleteAnnotation with annotation with PID " . $annotationID);
        $output = json_encode($output);
    }
    drupal_json_output($output);
    drupal_exit();
}

/**
 * Menu callback normal_path - returns URL passed t.
 */
function islandora_web_annotations_normal_path(){
  if(isset($_GET['data_url'])){
    $full_path = $_GET['data_url'];
    $path = parse_url($full_path)['path'];

    // Trim left directory separator as this will change the result
    // of drupal_lookup_path
    $path = ltrim($path,'/');
    echo drupal_lookup_path('source', $path);

  }
  else {
    echo 'GET VAR not set.';
  }
  drupal_exit();
}