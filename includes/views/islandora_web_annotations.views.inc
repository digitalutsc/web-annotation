<?php
/**
 * Created by PhpStorm.
 * User: kpham
 * Date: 2017-06-08
 * Time: 17:35 KIM PHAM - A WORK IN PROGRESS. handler change to islandora_web_annotations_handler_htmlrender if need to render html
 */

/**
 * Implements hook_views_data().
 */
function islandora_web_annotations_views_data_alter() {
    $data['islandora_solr']['annotation_value']['field']['handler'] = 'islandora_web_annotations_handler_htmlrender';
    return $data;
}