<?php
/**
 * Implements hook_views_data_alter().
 */

function islandora_web_annotations_views_data_alter(&$data) {
    $data['islandora_solr']['annotation_value_render'] = array(
        'title' => t('Render html field'),
        'help' => t('Will render in text html.'),
        'field' => array(
            'handler' => 'islandora_web_annotations_handler_htmlrender',
        ),
    );
//    return $data;
}