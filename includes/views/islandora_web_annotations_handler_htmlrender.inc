<?php
/**
 * @file
 * Definition of appnovation_fillout_viewsfield_handler_fillout.
 * KIM PHAM - A WORK IN PROGRESS.
 */

class islandora_web_annotations_handler_htmlrender extends views_handler_field {
    function render($values) {
        $value = $values->{$this->field_alias};
        return $value;
    }
}
/**
 * Provides a field which will display a link to edit the node if any other listed fields are empty.
 */
