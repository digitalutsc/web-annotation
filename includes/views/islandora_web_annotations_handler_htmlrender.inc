<?php
/**
 * @file
 * Definition of appnovation_fillout_viewsfield_handler_fillout.
 * KIM PHAM - A WORK IN PROGRESS.
 */

class islandora_web_annotations_handler_htmlrender extends views_handler_field {
    function render($values) {
        watchdog("test", "1111");
        $value = $values->{$this->field_alias};
        return $value;

    }
}
