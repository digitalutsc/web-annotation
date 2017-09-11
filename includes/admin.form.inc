<?php

/**
 * @file
 * Handles the display/submission of the admin settings form for this module.
 */

/**
 * Defines the admin settings form.
 *
 * @param array $form
 *   The Drupal form definition.
 * @param array $form_state
 *   The Drupal form state.
 *
 * @return array
 *   The Drupal form definition.
 */
function islandora_web_annotations_admin(array $form, array &$form_state) {
  module_load_include('inc', 'islandora', 'includes/solution_packs');
  $form = array();
  $form['islandora_web_annotations_verbose'] = array(
      '#type' => 'checkbox',
      '#title' => t('Verbose Alert Messages'),
      '#description' => t('Provides verbose (alert) messages, useful when testing, debuging and developing.'),
      '#default_value' => variable_get('islandora_web_annotations_verbose', FALSE),
  );
  $form['islandora_web_annotations_hide_list_block'] = array(
      '#type' => 'checkbox',
      '#title' => t('Hide Default Annotation List Block.'),
      '#description' => t('When checked, the default list of annotations is hidden.  This will allow you to use a Solr view block instead.'),
      '#default_value' => variable_get('islandora_web_annotations_hide_list_block', FALSE),
  );
  $form['islandora_web_annotations_load_true'] = array(
      '#type' => 'checkbox',
      '#title' => t('Load annotations by default for basic and large images.'),
      '#description' => t('When checked, annotations will be loaded by default for basic and large images.  You will still be able to toggle annotations (view, hide).'),
      '#default_value' => variable_get('islandora_web_annotations_load_true', FALSE),
  );
  $form['islandora_web_annotations_remove_clipper'] = array(
      '#type' => 'checkbox',
      '#title' => t('Remove clipper for large images.'),
      '#description' => t('When checked, the clipper from the large image solution pack will be removed.'),
      '#default_value' => variable_get('islandora_web_annotations_remove_clipper', FALSE),
  );
  $form['islandora_web_annotations_namespace'] = array(
      '#type' => 'textfield',
      '#title' => t('Annotation Namespace'),
      '#description' => t('Please carefully select the namespace to use for annotation objects.'),
      '#default_value' => variable_get('islandora_web_annotations_namespace'),
      '#required' => TRUE,
  );
  $form['islandora_web_annotations_isannotationcontainerof_solr_field'] = array(
      '#type' => 'textfield',
      '#title' => t('The isAnnotationContainerOf Solr field'),
      '#required' => TRUE,
      '#description' => t('Sets the Solr field containing an object\'s isAnnotationContainerOf relationship.'),
      '#default_value' => variable_get('islandora_web_annotations_isannotationcontainerof_solr_field', 'RELS_EXT_isAnnotationContainerOf_uri_s'),
  );
  $form['islandora_web_annotations_inprocess'] = array(
    '#type' => 'textarea',
    '#title' => t('Objects for which AnnotationContainers are being currently created.'),
    '#required' => FALSE,
    '#description' => t('Editing this field can distrupt AnnotationContainer creation. Provided here to aid troubleshooting.'),
    '#default_value' => variable_get('islandora_web_annotations_inprocess', ''),
  );
  $form['actions'] = array('#type' => 'actions');
  $form['actions']['reset'] = array(
      '#type' => 'submit',
      '#value' => t('Reset to defaults'),
      '#weight' => 1,
      '#submit' => array('islandora_web_annotations_admin_reset'),
  );

  $form = system_settings_form($form);
  return $form;

}

/**
 * Form reset for allowing the deletion of the viewer variable.
 */
function islandora_web_annotations_admin_reset($form, &$form_state)
{
  $op = $form_state['clicked_button']['#id'];
  switch ($op) {
    case 'edit-reset':
      variable_del('islandora_web_annotations_verbose');
      break;
  }
}
