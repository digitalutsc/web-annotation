/**
 *
 * @file
 * Contains annotations related functions specific to basic images
 *
 */

var g_contentType = "basic-image";

jQuery(document).ready(function() {
    var image_position = jQuery(".islandora-basic-image-content img").position();
    var image_top_pos = image_position.top;
    var image_left_pos = image_position.left;
    if(Drupal.settings.islandora_web_annotations.view == true) {
        var loadAnnotationsButton = jQuery('<button id="load-annotation-button" title="Toggle Annotations" class="annotator-adder-actions__button h-icon-annotate" onclick="getAnnotationsBasicImage()"></button>');
        loadAnnotationsButton.appendTo(jQuery(".islandora-basic-image-content")[0]);

        //Update button position for consistency.
        var update_pos_css = {
            top: image_top_pos,
            left: image_left_pos
        };
        jQuery("#load-annotation-button").css(update_pos_css);

        // Make sure that the basic image has loaded before loading annotations by default.
        jQuery("img[typeof='foaf:Image']").load(function() {
            if (Drupal.settings.islandora_web_annotations.load_true == true) {
                getAnnotationsBasicImage();
            }
        });
    }

    if(Drupal.settings.islandora_web_annotations.create == true) {
        var addButton = jQuery('<button id="add-annotation-button" class="annotator-adder-actions__button h-icon-add" title="Add Annotation" onclick="initBasicImageAnnotation();"></button>');
        addButton.appendTo(jQuery(".islandora-basic-image-content")[0]);
        //Update button position for consistency.
        var update_pos_css = {
            top: image_top_pos,
            left: image_left_pos + 48
        };
        jQuery("#add-annotation-button").css(update_pos_css);
    }

    executeCommonLoadOperations();



});


function initBasicImageAnnotation(){
    var m_image = jQuery("div[class='islandora-basic-image-content']").find("img[typeof='foaf:Image']").first();
    jQuery(m_image).unwrap();

    anno.makeAnnotatable(m_image[0]);

    anno.addHandler("onAnnotationCreated", function(annotation) {
        if(Drupal.settings.islandora_web_annotations.create == true) {
            var objectPID = getBasicImagePID();
            annotation.pid = "New";
            createAnnotation(objectPID, annotation);
        } else {
            var msg = "You do not have permissions to save annotations for basic image.";
            verbose_alert(msg, msg);
        }
    });

    anno.addHandler("onAnnotationUpdated", function(annotation) {
        updateAnnotation(annotation);
    });

    anno.addHandler("onAnnotationRemoved", function(annotation) {
        deleteAnnotation(annotation);
    });

    jQuery("#add-annotation-button").remove();
    jQuery(".annotorious-hint").css("left", "45px");
}

function getAnnotationsBasicImage() {
    // issue#151 - reset annotation
    anno.showSelectionWidget();

    if(jQuery(".annotorious-hint-icon").is(":visible")=== false) {
        initBasicImageAnnotation();
    }
    var objectPID = getBasicImagePID();
    getAnnotations(objectPID);

    // issue#151 - Ensure that the user is not able to create annotations if they do not have permission to do so
    if(Drupal.settings.islandora_web_annotations.create == false) {
        anno.hideSelectionWidget();
    }
}

function getBasicImagePID() {

    var objectURL = window.location.href;
    // get the (un-aliased) relative URL.
    objectURL = get_normal_path(objectURL);
    var objectPID = objectURL.substr(objectURL.lastIndexOf('/') + 1);
    objectPID = objectPID.replace("%3A", ":");
    objectPID = objectPID.replace("#", "");
    return objectPID;
}

