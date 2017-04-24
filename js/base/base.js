/**
 * @file
 * Contains AJAX calls to the Islandora Annotation Server/backend
 * Can be used against multiple content types or viewers
 * Aim is to develop this as a base class
 *
 */

var annotationContainerID = null;
var label_prefix = "label_anno";
var b_annotationsShown = false;

function executeCommonLoadOperations() {
    // Apply permissions to edit, delete annotations
    anno.addHandler("onPopupShown", function(annotation) {
        var user = Drupal.settings.islandora_web_annotations.user;
        var createdByMe = (user == annotation.creator) ? true:false;

        jQuery(".annotorious-popup-button-edit").hide();
        jQuery(".annotorious-popup-button-delete").hide();

        if(Drupal.settings.islandora_web_annotations.edit_any == true || (Drupal.settings.islandora_web_annotations.edit_own == true && createdByMe == true)) {
            jQuery(".annotorious-popup-button-edit").show();
        }
        if(Drupal.settings.islandora_web_annotations.delete_any == true || (Drupal.settings.islandora_web_annotations.delete_own == true && createdByMe == true)) {
            jQuery(".annotorious-popup-button-delete").show();
        }
    });
}

function createAnnotation(targetObjectId, annotationData) {
    var user = Drupal.settings.islandora_web_annotations.user;
    var metadata = {}
    metadata.creator = user;

    var annotation = {
        targetPid: targetObjectId,
        metadata: metadata,
        annotationData: annotationData
    };

    jQuery.ajax({
        url: location.protocol + '//' + location.host + '/islandora_web_annotations/create',
        dataType: 'json',
        type: 'POST',
        data: annotation,
        error: function() {
            var msg = "Error in creating annotation.";
            verbose_alert(msg, msg);
        },
        success: function(data) {
            var jsonData = JSON.parse(data);
            var status = jsonData.status;
            if(status && status == "Fail"){
                alert("Error in creating annotation.  Please review your drupal log.");
                return;
            }
            var pid = jsonData.pid;
            var creator = jsonData.creator;
            var created = jsonData.created;
            var checksum = jsonData.checksum;

            updateNewAnnotationInfo(pid, creator, created, checksum);
            insertLabelForNewAnnotation(pid, annotationData);
            var verbose_message = "Annotation successfully created: " + data;
            var short_message = "Annotation successfully created.";
            verbose_alert(short_message, verbose_message);
        }
    });


}

// We need to update the current annnotation datastore with pid and other info to preform operations and enforce access
function updateNewAnnotationInfo(pid, creator, created, checksum) {
    var annotations = anno.getAnnotations()
    for(var j = 0; j < annotations.length; j++){
        if(annotations[j].pid == "New") {
            annotations[j].pid = pid;
            annotations[j].creator = creator;
            annotations[j].created = created;
            annotations[j].checksum = checksum;
            break;
        }
    }
}

function getAnnotations(targetObjectId) {
    // getAnnotations is converted to a Toggle - issue#70
    if(b_annotationsShown == true) {
        anno.removeAll();
        deleteAllLabelsAndBlockItems();
        b_annotationsShown = false;
        return;
    }

    var annotation = {
        targetPid: targetObjectId
    };
    jQuery.ajax({
        url: location.protocol + '//' + location.host + '/islandora_web_annotations/get',
        dataType: 'json',
        type: 'GET',
        data: annotation,
        error: function() {
            var msg = "Error in loading annotations";
            verbose_alert(msg, msg);
        },
        success: function(data) {

            // In case user has inserted items before loading, remove them to reload those items
            anno.removeAll();
            deleteAllLabelsAndBlockItems();

            // Label related
            var canvas = jQuery(".islandora-"+ g_contentType + "-content").find("canvas")[0]
            var htmlBlock = "";

            // Extract data
            var jsonData = JSON.parse(data);
            annotationContainerID = jsonData["@id"];
            var annotations = jsonData.first.items;

            for(var i = 0; i< annotations.length; i++) {
                try {
                    var pid = annotations[i].pid;
                    var src = annotations[i].src;
                    var text = annotations[i].text;
                    htmlBlock = htmlBlock + "<li id='block_label_"+ pid + "' style='margin-bottom: 8px'> <b>[" + (i+1) + "]</b> " + text + "</li>";

                    var context = annotations[i].context;
                    var type = annotations[i].shapes[0].type;
                    var x1 = Number(annotations[i].shapes[0].geometry.x);
                    var y1 = Number(annotations[i].shapes[0].geometry.y);
                    var width1 = Number(annotations[i].shapes[0].geometry.width);
                    var height1 = Number(annotations[i].shapes[0].geometry.height);
                    var creator = annotations[i].creator;
                    var created = annotations[i].created;
                    var checksum = annotations[i].checksum;

                    var myAnnotation = {
                        src: src,
                        text: text,
                        pid: pid,
                        creator: creator,
                        created: created,
                        checksum: checksum,
                        shapes: [{
                            type: type,
                            geometry: {x: x1, y: y1, width: width1, height: height1}
                        }],
                        editable: true,
                        context: context
                    };
                    anno.addAnnotation(myAnnotation);
                } catch(e){
                    var msg = "Error in inserting an annotation";
                    verbose_alert(msg, msg);
                }
                insertLabel(g_contentType, i+1, pid, canvas, x1, y1, width1, height1);
            }

            htmlBlock = htmlBlock + "</ul>";
            insertUpdateAnnotationDataBlock(htmlBlock);

        }
    });
    b_annotationsShown = true;
}

function updateAnnotation(annotationData) {

    // Get metadata
    var user = Drupal.settings.islandora_web_annotations.user;
    var creator = annotationData.creator;
    var created = annotationData.created;
    var checksum = annotationData.checksum;

    var metadata = {}
    metadata.author = user;
    metadata.creator = creator;
    metadata.created = created;

    // Do not want data duplicated
    delete annotationData.creator;
    delete annotationData.created;
    delete annotationData.checksum;


    var annotationPID = annotationData.pid;
    var annotation = {
        annotationPID: annotationPID,
        metadata: metadata,
        annotationData: annotationData

    };

    jQuery.ajax({
        url: location.protocol + '//' + location.host +'/islandora_web_annotations/update',
        beforeSend: function (request)
        {
            request.setRequestHeader("If-Match", checksum);
        },
        dataType: 'json',
        type: 'PUT',
        data: annotation,
        error: function() {
            var msg = "Error in updating annotation.";
            verbose_alert(msg, msg);

        },
        success: function(data) {
            var jsonData = JSON.parse(data);
            var status = jsonData.status;
            var annoInfo = jsonData.data;

            if(status == "success") {
                var checksum = annoInfo.checksum;
                var updatedText = annoInfo.body.text;
                var creator = annoInfo.creator;
                var created = annoInfo.created;

                updateAnnotationInfo(annotationPID, checksum, updatedText, creator, created);
                var verbose_message = "Successfully updated the annotation: " + JSON.stringify(annoInfo);
                var short_message = "Update successful.";
                verbose_alert(short_message, verbose_message);
            } else if(status == "conflict"){
                var msg = "There was an edit conflict.  Please copy your changes, reload the annotations and try again";
                verbose_alert(msg, msg);
            } else {
                var verbose_message = "Unable to update.  Error info: " + JSON.stringify(annoInfo);
                var short_message = "Error: Unable to update.";
                verbose_alert(short_message, verbose_message);
            }
        }
    });

}

// Update AnnotatoinDatastore
function updateAnnotationInfo(pid, checksum, updatedText, creator, created) {
    var annotations = anno.getAnnotations()
    for(var j = 0; j < annotations.length; j++){
        if(annotations[j].pid == pid) {
            annotations[j].checksum = checksum;
            annotations[j].creator = creator;
            annotations[j].created = created;
            var currentText = document.getElementById("block_label_" + pid).innerHTML;
            currentText = currentText.trim()
            var labelNumber = currentText.substring(4, 5);
            document.getElementById("block_label_" + pid).innerHTML = "<b>[" + labelNumber + "]</b> " + updatedText + "</li>";
            break;
        }
    }
}


function deleteAnnotation(annotationData) {
    var annotationID = annotationData.pid;
    var checksum = annotationData.checksum;

    var annotation = {
        annotationID: annotationID,
        annotationContainerID: annotationContainerID,
        annotationData: annotationData
    };

    // annotationData data - in case it fails to delete
    delete annotationData.checksum;

    jQuery.ajax({
        url: location.protocol + '//' + location.host + '/islandora_web_annotations/delete',
        beforeSend: function (request)
        {
            request.setRequestHeader("If-Match", checksum);
        },
        dataType: 'json',
        type: 'DELETE',
        data: annotation,
        error: function() {

            var msg = "Error in deleting annotation.";
            verbose_alert(msg, msg);

        },
        success: function(data) {
            var jsonData = JSON.parse(data);
            var status = jsonData.status;
            var annoInfo = jsonData.data;
            if(status == "success") {
                var verbose_message = "Successfully deleted the annotation: " + JSON.stringify(annoInfo);
                var short_message = "Annotation successfully deleted.";
                verbose_alert(short_message, verbose_message);
            } else if(status == "conflict"){
                var msg = "There was an edit conflict.  Please reload the annotations to view the changes.  You can try again to delete.";
                verbose_alert(msg, msg);
            } else {
                var verbose_message = "Unable to delete.  Error info: "  + JSON.stringify(annoInfo);
                var short_message = "Error: Unable to delete.";
                verbose_alert(short_message, verbose_message);
            }
        }
    });

    deleteLabelAndDataBlockItem(annotationID);
}

/**
 *
 * @param htmlBlock
 * @param contentType
 */
function insertUpdateAnnotationDataBlock(htmlBlock) {
    // If not already installed
    if(jQuery("#annotation-list").length == 0) {
        jQuery('<div><h2>Annotations</h2><ul id="annotation-list" style="list-style-type: none;">' + htmlBlock + '</ul></div>').appendTo(jQuery("#block-system-main"));
    } else {
        jQuery(htmlBlock).appendTo(jQuery("#annotation-list"));
    }

    if(Drupal.settings.islandora_web_annotations.hide_list_block == true){
        jQuery("#annotation-list").parent().hide();
    }
}



function insertLabelForNewAnnotation(pid, annotation) {
    var i = anno.getAnnotations().length;
    var x1 = Number(annotation.shapes[0].geometry.x);
    var y1 = Number(annotation.shapes[0].geometry.y);
    var width1 = Number(annotation.shapes[0].geometry.width);
    var height1 = Number(annotation.shapes[0].geometry.height);
    var canvas = jQuery(".islandora-"+ g_contentType + "-content").find("canvas")[0]

    insertLabel(g_contentType, i, pid, canvas, x1, y1, width1, height1);

    var text = annotation.text;
    var htmlItem = "<li id='block_label_"+ pid + "' style='margin-bottom: 8px'><b> [" + i + "]</b> " + text + "</li>";
    insertUpdateAnnotationDataBlock(htmlItem);
}

/**
 *
 * @param contentType: basic-image, large-image
 * @param i - index of the annotation
 * @param canvas - canvas of the image, used to calculate size
 * @param x1 - x position of the annotation
 * @param y1 - y position of the annotation
 * @param width1 - width of the annotation box
 * @param height1 - height of the annotation box
 */
function insertLabel(contentType, i, pid, canvas, x1, y1, width1, height1) {
    var decimalX = x1 + width1;
    var decimalY = y1 + height1;

    // If already exists, then return
    if(jQuery(document.getElementById(label_prefix + pid)).length >= 1){
        return;
    }

    if(contentType == "large-image") {
        var eleSpan = document.createElement("span");
        var eleText = document.createTextNode(i);     // Create a text node
        eleSpan.appendChild(eleText);
        eleSpan.className = "marker-large-mage";
        eleSpan.setAttribute("id", label_prefix + pid);

        var imagePoint = Drupal.settings.islandora_open_seadragon_viewer.viewport.viewportToImageCoordinates(decimalX, decimalY);

        Drupal.settings.islandora_open_seadragon_viewer.addOverlay({
            element: eleSpan,
            px: imagePoint.x,
            py: imagePoint.y,
            checkResize: false,
            placement: OpenSeadragon.OverlayPlacement.BOTTOM_RIGHT
        });

    } else {
        var canvasWidth = canvas.width;
        var canvasHeight = canvas.height;

        var pixelX = (decimalX * canvasWidth) - 20;
        var pixelY = (decimalY * canvasHeight) - 20;

        jQuery('<span class="marker" id="' + label_prefix + pid +'">' + i + '</span>').css({
            top: pixelY,
            left: pixelX
        }).appendTo(jQuery(jQuery(canvas).parent()));
    }
}

function deleteLabelAndDataBlockItem(annotationID) {
    // Remove Label
    if(g_contentType == "large-image"){
        Drupal.settings.islandora_open_seadragon_viewer.removeOverlay(label_prefix+ annotationID);
    } else {
        jQuery(document.getElementById(label_prefix + annotationID)).remove();
    }
    jQuery(document.getElementById("block_label_" + annotationID)).remove();
}

function deleteAllLabelsAndBlockItems(){
    if(g_contentType == "large-image"){
        var labels = jQuery('span[id^="'+ label_prefix + '"]');
        for (var j = 0; j < labels.length; j++){
            var labelID =  labels[j].id;
            Drupal.settings.islandora_open_seadragon_viewer.removeOverlay(labelID);
        }
    } else {
        jQuery('span[id^="'+ label_prefix + '"]').remove();
    }
    jQuery("#annotation-list").parent().remove();
}

function verbose_alert(short_message, verbose_message) {
    var verbose_flag = Drupal.settings.islandora_web_annotations.verbose_messages;
    if(verbose_flag){
        alert(verbose_message);
    } else {
        alert(short_message);
    }
}


function get_normal_path(path){

     var normal_path = '';

     jQuery.ajax({
        url: location.protocol + '//' + location.host + '/islandora_web_annotations/normal_path',
        dataType: 'text',
        type: 'GET',
        async: false,
        data: {data_url : path},
        error: function() {
            var msg = "Error in get_normal_path";
            verbose_alert(msg, msg);
        },
        success: function(data) {
            normal_path = data;
        }
    });

    return normal_path;

}
