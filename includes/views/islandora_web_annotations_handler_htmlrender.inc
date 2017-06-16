<?php
/**
 * Definition of islandora_web_annotations_handler_htmlrender
 */

class islandora_web_annotations_handler_htmlrender extends views_handler_field {
    function render($values) {
        $value = $this->get_value($values);
        return $value;
    }
}