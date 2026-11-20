import React, { useState } from 'react';
import DynamicListView from './DynamicListView';
import { DynamicKanbanView } from './kanban';
import ViewSwitcher from './common/ViewSwitcher';

/**
 * UniversalDataView - Dual-view wrapper providing both List and Kanban views for any module
 * 
 * Works out-of-the-box for any configuration:
 * - If module config has stages/grouping, Kanban displays distinct stage columns with drag & drop
 * - If module config does NOT have stages/grouping, Kanban displays all records as responsive cards without stages
 * - Preserves all existing DynamicListView capabilities (selection, search, sort, pagination, export, column config, bulk actions)
 * - Seamlessly integrates ViewSwitcher in the top bar
 */
export default function UniversalDataView({
  config,
  data = [],
  loading = false,
  error = null,
  onRowClick,
  onCreateClick,
  onDeleteClick,
  onRecordMove,
  breadcrumbs = [],
  defaultView = 'list',
  ...restProps
}) {
  const [viewMode, setViewMode] = useState(defaultView); // 'list' | 'kanban'

  const viewSwitchControl = (
    <ViewSwitcher
      currentView={viewMode}
      onViewChange={(nextView) => setViewMode(nextView)}
    />
  );

  if (viewMode === 'kanban') {
    return (
      <DynamicKanbanView
        config={config}
        data={data}
        loading={loading}
        error={error}
        onCardClick={onRowClick}
        onCreateClick={onCreateClick}
        onRecordMove={onRecordMove}
        breadcrumbs={breadcrumbs}
        viewSwitchControl={viewSwitchControl}
        {...restProps}
      />
    );
  }

  return (
    <DynamicListView
      config={config}
      data={data}
      loading={loading}
      error={error}
      onRowClick={onRowClick}
      onCreateClick={onCreateClick}
      onDeleteClick={onDeleteClick}
      breadcrumbs={breadcrumbs}
      viewSwitchControl={viewSwitchControl}
      {...restProps}
    />
  );
}
