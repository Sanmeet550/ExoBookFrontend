import {
  HELPDESK_ENDPOINTS,
  helpdeskAccessService,
  helpdeskAssignmentRuleService,
  helpdeskPriorityService,
  helpdeskSlaPolicyService,
  helpdeskStageService,
  helpdeskTagService,
  helpdeskTeamService,
  helpdeskTicketTypeService,
} from '../../services/resources/helpdeskService';

/**
 * Helpdesk navigation and master definitions.
 *
 * Every Configuration screen is described here and rendered by the generic HelpdeskMaster
 * component on top of the shared DynamicListView / DynamicFormView. Dropdown values always come
 * from backend endpoints; no master records are hardcoded.
 */

export const ROLE_RANK = { user: 1, team_leader: 2, manager: 3, administrator: 4 };
export const hasRole = (me, role) => Boolean(me) && ROLE_RANK[me.role] >= ROLE_RANK[role];

export const ROLE_OPTIONS = [
  { value: 'user', label: 'Helpdesk User' },
  { value: 'team_leader', label: 'Helpdesk Team Leader' },
  { value: 'manager', label: 'Helpdesk Manager' },
  { value: 'administrator', label: 'Helpdesk Administrator' },
];

export const ASSIGNMENT_METHOD_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'least_loaded', label: 'Least Loaded' },
];

export const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'portal', label: 'Portal' },
  { value: 'api', label: 'API' },
];

export const SLA_STATUS_LABELS = {
  in_progress: 'In Progress',
  achieved: 'Achieved',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const SLA_CHIP_COLORS = {
  'In Progress': 'info',
  Achieved: 'success',
  Failed: 'error',
  Cancelled: 'default',
};

/** Top navigation, filtered by the user's Helpdesk role (the backend enforces the same rules). */
export const buildHelpdeskNav = (me) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'myTickets', label: 'My Tickets' },
    { id: 'allTickets', label: 'All Tickets' },
    { id: 'ratings', label: 'Customer Ratings' },
    { id: 'reporting', label: 'Reporting' },
  ];
  const dropdowns = [];
  if (hasRole(me, 'manager')) {
    const children = [
      { id: 'teams', label: 'Teams' },
      { id: 'ticketTypes', label: 'Ticket Types' },
      { id: 'stages', label: 'Ticket Stages' },
      { id: 'tags', label: 'Ticket Tags' },
      { id: 'priorities', label: 'Priorities' },
      { id: 'slaPolicies', label: 'SLA Policies' },
      { id: 'slaStatus', label: 'SLA Status' },
      { id: 'assignmentRules', label: 'Assignment Rules' },
    ];
    if (hasRole(me, 'administrator')) {
      children.push({ id: 'accessRights', label: 'Access Rights' });
    }
    dropdowns.push({ id: 'configuration', label: 'Configuration', children });
  }
  return { tabs, dropdowns };
};

const relation = (endpoint, model) => ({ model, endpoint, value_field: 'id', label_field: 'name' });
const m2o = (name, label, endpoint, extra = {}) => ({
  name, label, type: 'many2one', cols: 3, relation: relation(endpoint, label), ...extra,
});

const emptyToNull = (value) => (value === '' || value === undefined ? null : value);
const toNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value));
const yesNo = (value) => (value ? 'Yes' : 'No');

const activeField = { name: 'active', label: 'Active', type: 'boolean', default: true, cols: 3 };
const sequenceField = { name: 'sequence', label: 'Sequence', type: 'number', default: 10, cols: 3 };

export const HELPDESK_MASTERS = {
  teams: {
    chatterModel: 'helpdesk_team',
    title: 'Teams',
    singular: 'Team',
    service: helpdeskTeamService,
    refreshEndpoints: [HELPDESK_ENDPOINTS.teams],
    columns: [
      { field: 'name', headerName: 'Team', flex: 1.2, sortable: true },
      { field: 'team_leader_name', headerName: 'Team Leader', flex: 1, sortable: true },
      { field: 'member_count', headerName: 'Members', width: 90, sortable: true },
      { field: 'assignment_label', headerName: 'Assignment', width: 130, sortable: true },
      { field: 'email', headerName: 'Email', flex: 1, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Team Name', type: 'text', required: true, cols: 2 },
      { name: 'email', label: 'Team Email', type: 'text', cols: 2 },
      m2o('team_leader_id', 'Team Leader', HELPDESK_ENDPOINTS.agents),
      { name: 'assignment_method', label: 'Assignment Method', type: 'selection', options: ASSIGNMENT_METHOD_OPTIONS, default: 'manual', required: true, cols: 3 },
      sequenceField,
      { name: 'member_ids', label: 'Members', type: 'many2many', cols: 1, relation: relation(HELPDESK_ENDPOINTS.agents, 'Agent'), helperText: 'Only users with Helpdesk access in this company can be selected.' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 2, cols: 1 },
      activeField,
    ],
    toRow: (record) => ({
      ...record,
      member_count: (record.member_ids || []).length,
      assignment_label: ASSIGNMENT_METHOD_OPTIONS.find((o) => o.value === record.assignment_method)?.label || record.assignment_method,
      active_label: yesNo(record.active),
    }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      email: emptyToNull(form.email?.trim?.() ?? form.email),
      team_leader_id: toNumber(form.team_leader_id),
      assignment_method: form.assignment_method || 'manual',
      sequence: toNumber(form.sequence) ?? 10,
      member_ids: Array.isArray(form.member_ids) ? form.member_ids : [],
      description: emptyToNull(form.description),
      active: Boolean(form.active),
    }),
  },

  ticketTypes: {
    chatterModel: 'helpdesk_ticket_type',
    title: 'Ticket Types',
    singular: 'Ticket Type',
    service: helpdeskTicketTypeService,
    refreshEndpoints: [HELPDESK_ENDPOINTS.ticketTypes],
    draggable: true,
    columns: [
      { field: 'name', headerName: 'Ticket Type', flex: 1, sortable: true },
      { field: 'description', headerName: 'Description', flex: 2, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Ticket Type', type: 'text', required: true, cols: 2 },
      sequenceField,
      { name: 'description', label: 'Description', type: 'textarea', rows: 2, cols: 1 },
      activeField,
    ],
    toRow: (record) => ({ ...record, active_label: yesNo(record.active) }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      sequence: toNumber(form.sequence) ?? 10,
      description: emptyToNull(form.description),
      active: Boolean(form.active),
    }),
  },

  stages: {
    chatterModel: 'helpdesk_stage',
    title: 'Ticket Stages',
    singular: 'Stage',
    service: helpdeskStageService,
    refreshEndpoints: [HELPDESK_ENDPOINTS.stages],
    draggable: true,
    columns: [
      { field: 'name', headerName: 'Stage', flex: 1, sortable: true },
      { field: 'resolved_label', headerName: 'Resolved Stage', width: 120, sortable: true },
      { field: 'closed_label', headerName: 'Closed Stage', width: 110, sortable: true },
      { field: 'folded_label', headerName: 'Folded in Kanban', width: 130, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Stage Name', type: 'text', required: true, cols: 2 },
      sequenceField,
      { name: 'is_resolved', label: 'Resolved stage (sets the resolved date)', type: 'boolean', cols: 3 },
      { name: 'is_closed', label: 'Closed stage (sets the closed date)', type: 'boolean', cols: 3 },
      { name: 'is_folded', label: 'Folded in Kanban', type: 'boolean', cols: 3 },
      { name: 'description', label: 'Description', type: 'textarea', rows: 2, cols: 1 },
      activeField,
    ],
    toRow: (record) => ({
      ...record,
      resolved_label: yesNo(record.is_resolved),
      closed_label: yesNo(record.is_closed),
      folded_label: yesNo(record.is_folded),
      active_label: yesNo(record.active),
    }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      sequence: toNumber(form.sequence) ?? 10,
      is_resolved: Boolean(form.is_resolved),
      is_closed: Boolean(form.is_closed),
      is_folded: Boolean(form.is_folded),
      description: emptyToNull(form.description),
      active: Boolean(form.active),
    }),
  },

  priorities: {
    chatterModel: 'helpdesk_priority',
    title: 'Priorities',
    singular: 'Priority',
    service: helpdeskPriorityService,
    refreshEndpoints: [HELPDESK_ENDPOINTS.priorities],
    draggable: true,
    columns: [
      { field: 'name', headerName: 'Priority', flex: 1, sortable: true },
      { field: 'color', headerName: 'Color', width: 110, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Priority', type: 'text', required: true, cols: 3 },
      sequenceField,
      { name: 'color', label: 'Color (hex, e.g. #EF4444)', type: 'text', cols: 3 },
      activeField,
    ],
    toRow: (record) => ({ ...record, active_label: yesNo(record.active) }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      sequence: toNumber(form.sequence) ?? 10,
      color: emptyToNull(form.color?.trim?.() ?? form.color),
      active: Boolean(form.active),
    }),
  },

  tags: {
    chatterModel: 'helpdesk_tag',
    title: 'Ticket Tags',
    singular: 'Tag',
    service: helpdeskTagService,
    refreshEndpoints: [HELPDESK_ENDPOINTS.tags],
    columns: [
      { field: 'name', headerName: 'Tag', flex: 1, sortable: true },
      { field: 'color', headerName: 'Color', width: 110, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Tag', type: 'text', required: true, cols: 2 },
      { name: 'color', label: 'Color (hex, e.g. #3B82F6)', type: 'text', cols: 2 },
      activeField,
    ],
    toRow: (record) => ({ ...record, active_label: yesNo(record.active) }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      color: emptyToNull(form.color?.trim?.() ?? form.color),
      active: Boolean(form.active),
    }),
  },

  slaPolicies: {
    chatterModel: 'helpdesk_sla_policy',
    title: 'SLA Policies',
    singular: 'SLA Policy',
    service: helpdeskSlaPolicyService,
    columns: [
      { field: 'name', headerName: 'Policy', flex: 1.2, sortable: true },
      { field: 'team_label', headerName: 'Team', flex: 1, sortable: true },
      { field: 'priority_label', headerName: 'Priority', width: 110, sortable: true },
      { field: 'type_label', headerName: 'Ticket Type', flex: 1, sortable: true },
      { field: 'response_time', headerName: 'Response (h)', width: 110, sortable: true },
      { field: 'resolution_time', headerName: 'Resolution (h)', width: 120, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Policy Name', type: 'text', required: true, cols: 1 },
      m2o('team_id', 'Team (empty = any)', HELPDESK_ENDPOINTS.teams),
      m2o('priority_id', 'Priority (empty = any)', HELPDESK_ENDPOINTS.priorities),
      m2o('ticket_type_id', 'Ticket Type (empty = any)', HELPDESK_ENDPOINTS.ticketTypes),
      { name: 'response_time', label: 'First Response Within (hours)', type: 'number', cols: 3 },
      { name: 'resolution_time', label: 'Resolution Within (hours)', type: 'number', cols: 3 },
      m2o('target_stage_id', 'Stage to Reach (empty = resolved)', HELPDESK_ENDPOINTS.stages),
      activeField,
    ],
    toRow: (record) => ({
      ...record,
      team_label: record.team_name || 'Any',
      priority_label: record.priority_name || 'Any',
      type_label: record.ticket_type_name || 'Any',
      response_time: record.response_time ?? '—',
      resolution_time: record.resolution_time ?? '—',
      active_label: yesNo(record.active),
    }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      team_id: toNumber(form.team_id),
      priority_id: toNumber(form.priority_id),
      ticket_type_id: toNumber(form.ticket_type_id),
      target_stage_id: toNumber(form.target_stage_id),
      response_time: toNumber(form.response_time),
      resolution_time: toNumber(form.resolution_time),
      active: Boolean(form.active),
    }),
  },

  assignmentRules: {
    chatterModel: 'helpdesk_assignment_rule',
    title: 'Assignment Rules',
    singular: 'Assignment Rule',
    service: helpdeskAssignmentRuleService,
    draggable: true,
    columns: [
      { field: 'name', headerName: 'Rule', flex: 1.2, sortable: true },
      { field: 'team_name', headerName: 'Assign to Team', flex: 1, sortable: true },
      { field: 'method_label', headerName: 'Method', width: 130, sortable: true },
      { field: 'user_label', headerName: 'Agent', flex: 1, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Rule Name', type: 'text', required: true, cols: 2 },
      sequenceField,
      m2o('ticket_type_id', 'When Ticket Type is (empty = any)', HELPDESK_ENDPOINTS.ticketTypes),
      m2o('priority_id', 'When Priority is (empty = any)', HELPDESK_ENDPOINTS.priorities),
      { name: 'source', label: 'When Source is (empty = any)', type: 'selection', options: SOURCE_OPTIONS, cols: 3 },
      m2o('team_id', 'Assign to Team', HELPDESK_ENDPOINTS.teams, { required: true }),
      {
        name: 'assignment_method', label: 'Assignment Method', type: 'selection', required: true, default: 'round_robin', cols: 3,
        options: [...ASSIGNMENT_METHOD_OPTIONS.filter((o) => o.value !== 'manual'), { value: 'specific_user', label: 'Specific Agent' }, { value: 'manual', label: "Use the team's own method" }],
      },
      m2o('user_id', 'Agent (for Specific Agent)', HELPDESK_ENDPOINTS.agents),
      activeField,
    ],
    toRow: (record) => ({
      ...record,
      method_label: { round_robin: 'Round Robin', least_loaded: 'Least Loaded', specific_user: 'Specific Agent', manual: "Team's own method" }[record.assignment_method] || record.assignment_method,
      user_label: record.user_name || '—',
      active_label: yesNo(record.active),
    }),
    toPayload: (form) => ({
      name: form.name?.trim(),
      sequence: toNumber(form.sequence) ?? 10,
      ticket_type_id: toNumber(form.ticket_type_id),
      priority_id: toNumber(form.priority_id),
      source: emptyToNull(form.source),
      team_id: toNumber(form.team_id),
      assignment_method: form.assignment_method || 'round_robin',
      user_id: toNumber(form.user_id),
      active: Boolean(form.active),
    }),
  },

  accessRights: {
    chatterModel: 'helpdesk_access',
    title: 'Access Rights',
    singular: 'Access Right',
    service: helpdeskAccessService,
    refreshEndpoints: [HELPDESK_ENDPOINTS.agents],
    nameField: 'user_name',
    columns: [
      { field: 'user_name', headerName: 'User', flex: 1, sortable: true },
      { field: 'role_label', headerName: 'Helpdesk Role', flex: 1, sortable: true },
      { field: 'active_label', headerName: 'Active', width: 80, sortable: true },
    ],
    fields: [
      m2o('user_id', 'User', '/view/users', { required: true, cols: 2, helperText: 'The user cannot be changed after the access right is created.' }),
      { name: 'role', label: 'Helpdesk Role', type: 'selection', options: ROLE_OPTIONS, default: 'user', required: true, cols: 2 },
      activeField,
    ],
    toRow: (record) => ({
      ...record,
      role_label: ROLE_OPTIONS.find((o) => o.value === record.role)?.label || record.role,
      active_label: yesNo(record.active),
    }),
    toPayload: (form, isExisting) =>
      isExisting
        ? { role: form.role, active: Boolean(form.active) }
        : { user_id: toNumber(form.user_id), role: form.role || 'user' },
  },
};
