/**
 * Master Metadata Registry
 * 
 * Provides dynamic schema metadata for each SQLAlchemy/FastAPI model.
 * 
 * For every model, metadata describes:
 * - name: Field key
 * - label: Field title
 * - type: 'text' | 'number' | 'boolean' | 'date' | 'textarea' | 'many2one' | 'selection'
 * - required: boolean
 * - relation: { model, endpoint, value_field, label_field } (for many2one foreign keys)
 * - depends_on: { field, filter_field } (for cascading / dependent dropdowns e.g. State depends on Country)
 * - options: [ { label, value } ] (for Enum / selection fields)
 * - cols: Grid span width (1, 2, or 3 per row)
 */

export const MODEL_METADATA = {
  company: {
    model: 'company',
    title: 'Company',
    endpoint: '/company',
    fields: [
      { name: 'name', label: 'Company Legal Name', type: 'text', required: true, cols: 2 },
      { name: 'tax_number', label: 'Tax Identification Number / VAT', type: 'text', cols: 2 },
      { name: 'email', label: 'Corporate Email', type: 'text', cols: 3 },
      { name: 'mobile', label: 'Official Mobile / Phone', type: 'text', cols: 3 },
      { name: 'website', label: 'Website URL', type: 'text', cols: 3 },
      { name: 'street', label: 'Street Address', type: 'text', cols: 3 },
      { name: 'street2', label: 'Street Address 2', type: 'text', cols: 3 },
      { name: 'city', label: 'City', type: 'text', cols: 3 },
      { name: 'postal_code', label: 'Postal Code', type: 'text', cols: 3 },
      {
        name: 'country_id',
        label: 'Country',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'Country',
          endpoint: '/country/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'state_id',
        label: 'State',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'State',
          endpoint: '/state/view/all',
          value_field: 'id',
          label_field: 'name',
        },
        depends_on: {
          field: 'country_id',
          filter_field: 'country_id',
        },
      },
      {
        name: 'currency_id',
        label: 'Currency',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'Currency',
          endpoint: '/currency/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  partner: {
    model: 'partner',
    title: 'Contact',
    endpoint: '/partner',
    fields: [
      { name: 'name', label: 'Contact Full Name', type: 'text', required: true, cols: 2 },
      { name: 'email', label: 'Email Address', type: 'text', cols: 2 },
      { name: 'mobile', label: 'Mobile / Direct Phone', type: 'text', cols: 3 },
      { name: 'street', label: 'Street Address', type: 'text', cols: 3 },
      { name: 'street2', label: 'Street Address 2', type: 'text', cols: 3 },
      { name: 'city', label: 'City', type: 'text', cols: 3 },
      { name: 'postal_code', label: 'Postal Code', type: 'text', cols: 3 },
      {
        name: 'country_id',
        label: 'Country',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'Country',
          endpoint: '/country/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'state_id',
        label: 'State',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'State',
          endpoint: '/state/view/all',
          value_field: 'id',
          label_field: 'name',
        },
        depends_on: {
          field: 'country_id',
          filter_field: 'country_id',
        },
      },
      {
        name: 'is_customer',
        label: 'Is Customer',
        type: 'boolean',
        default: true,
        cols: 3,
      },
      {
        name: 'is_vendor',
        label: 'Is Vendor',
        type: 'boolean',
        default: false,
        cols: 3,
      },
    ],
  },

  product: {
    model: 'product',
    title: 'Product',
    endpoint: '/product',
    fields: [
      { name: 'name', label: 'Product Name', type: 'text', required: true, cols: 2 },
      { name: 'code', label: 'Product Code / SKU', type: 'text', required: true, cols: 2 },
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'selection',
        required: true,
        default: 'stockable',
        cols: 3,
        options: [
          { label: 'Stockable', value: 'stockable' },
          { label: 'Consumable', value: 'consumable' },
          { label: 'Service', value: 'service' },
        ],
      },
      { name: 'sales_price', label: 'Sales Price', type: 'number', cols: 3 },
      {
        name: 'categ_id',
        label: 'Product Category',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'ProductCategory',
          endpoint: '/product-category/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'uom_id',
        label: 'Unit of Measure (UOM)',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'UOM',
          endpoint: '/uom/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'is_sellable',
        label: 'Is Sellable',
        type: 'boolean',
        default: true,
        cols: 3,
      },
      {
        name: 'is_purchasable',
        label: 'Is Purchasable',
        type: 'boolean',
        default: true,
        cols: 3,
      },
      { name: 'sales_description', label: 'Sales Description', type: 'textarea', rows: 2, cols: 1 },
      { name: 'purchase_description', label: 'Purchase Description', type: 'textarea', rows: 2, cols: 1 },
    ],
  },

  country: {
    model: 'country',
    title: 'Country',
    endpoint: '/country',
    fields: [
      { name: 'name', label: 'Country Name', type: 'text', required: true, cols: 2 },
      { name: 'code', label: 'ISO Code (2 Letters)', type: 'text', required: true, cols: 2 },
      { name: 'phone_code', label: 'Calling Code', type: 'text', required: true, cols: 2 },
      {
        name: 'currency_id',
        label: 'National Currency',
        type: 'many2one',
        required: true,
        cols: 2,
        relation: {
          model: 'Currency',
          endpoint: '/currency/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  state: {
    model: 'state',
    title: 'State',
    endpoint: '/state',
    fields: [
      { name: 'name', label: 'State / Province Name', type: 'text', required: true, cols: 2 },
      { name: 'code', label: 'State Code', type: 'text', required: true, cols: 2 },
      {
        name: 'country_id',
        label: 'Country',
        type: 'many2one',
        required: true,
        cols: 1,
        relation: {
          model: 'Country',
          endpoint: '/country/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  currency: {
    model: 'currency',
    title: 'Currency',
    endpoint: '/currency',
    fields: [
      { name: 'name', label: 'Currency Code (e.g. USD)', type: 'text', required: true, cols: 3 },
      { name: 'full_name', label: 'Currency Full Name', type: 'text', required: true, cols: 3 },
      { name: 'symbol', label: 'Currency Symbol ($)', type: 'text', required: true, cols: 3 },
      { name: 'currency_unit_label', label: 'Unit Label', type: 'text', required: true, cols: 2 },
      { name: 'currency_subunit_label', label: 'Subunit Label', type: 'text', required: true, cols: 2 },
    ],
  },

  warehouse: {
    model: 'warehouse',
    title: 'Warehouse',
    endpoint: '/warehouse',
    fields: [
      { name: 'name', label: 'Warehouse Name', type: 'text', required: true, cols: 2 },
      { name: 'code', label: 'Warehouse Code (2-5 Chars)', type: 'text', required: true, cols: 2 },
      {
        name: 'company_id',
        label: 'Company',
        type: 'many2one',
        required: true,
        cols: 1,
        relation: {
          model: 'Company',
          endpoint: '/company/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  productCategory: {
    model: 'productCategory',
    title: 'Product Category',
    endpoint: '/product-category',
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true, cols: 2 },
      {
        name: 'parent_id',
        label: 'Parent Category',
        type: 'many2one',
        cols: 2,
        relation: {
          model: 'ProductCategory',
          endpoint: '/product-category/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  uom: {
    model: 'uom',
    title: 'Unit of Measure',
    endpoint: '/uom',
    fields: [
      { name: 'name', label: 'UOM Name (e.g. Unit, Kg, Hour)', type: 'text', required: true, cols: 2 },
      { name: 'quantity', label: 'Ratio Quantity', type: 'number', default: 1, cols: 2 },
      {
        name: 'reference_unit_id',
        label: 'Reference Unit',
        type: 'many2one',
        cols: 1,
        relation: {
          model: 'UOM',
          endpoint: '/uom/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  department: {
    model: 'department',
    title: 'Department',
    endpoint: '/department',
    fields: [
      { name: 'name', label: 'Department Name', type: 'text', required: true, cols: 2 },
      {
        name: 'company_id',
        label: 'Company',
        type: 'many2one',
        required: true,
        cols: 2,
        relation: {
          model: 'Company',
          endpoint: '/company/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },

  jobPosition: {
    model: 'jobPosition',
    title: 'Job Position',
    endpoint: '/job_position',
    fields: [
      { name: 'name', label: 'Job Title / Position', type: 'text', required: true, cols: 2 },
      {
        name: 'company_id',
        label: 'Company',
        type: 'many2one',
        required: true,
        cols: 2,
        relation: {
          model: 'Company',
          endpoint: '/company/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'department_id',
        label: 'Department',
        type: 'many2one',
        required: true,
        cols: 1,
        relation: {
          model: 'Department',
          endpoint: '/department/view/all',
          value_field: 'id',
          label_field: 'name',
        },
        depends_on: {
          field: 'company_id',
          filter_field: 'company_id',
        },
      },
    ],
  },

  employee: {
    model: 'employee',
    title: 'Employee',
    endpoint: '/employee',
    fields: [
      { name: 'name', label: 'Full Legal Name', type: 'text', required: true, cols: 2 },
      {
        name: 'company_id',
        label: 'Company',
        type: 'many2one',
        cols: 2,
        relation: {
          model: 'Company',
          endpoint: '/company/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'department_id',
        label: 'Department',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'Department',
          endpoint: '/department/view/all',
          value_field: 'id',
          label_field: 'name',
        },
        depends_on: {
          field: 'company_id',
          filter_field: 'company_id',
        },
      },
      {
        name: 'job_position_id',
        label: 'Job Position',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'JobPosition',
          endpoint: '/job_position/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'manager_id',
        label: 'Manager (Reporting Head)',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'Employee',
          endpoint: '/employee/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      { name: 'work_email', label: 'Work Email Address', type: 'text', cols: 2 },
      { name: 'work_phone', label: 'Work Phone Number', type: 'text', cols: 2 },
      { name: 'personal_email', label: 'Personal Email', type: 'text', cols: 2 },
      { name: 'personal_phone', label: 'Personal Phone', type: 'text', cols: 2 },
      { name: 'date_of_joining', label: 'Date of Joining', type: 'date', cols: 3 },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', cols: 3 },
      {
        name: 'gender',
        label: 'Gender',
        type: 'selection',
        cols: 3,
        options: [
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
          { label: 'Other', value: 'Other' },
        ],
      },
      {
        name: 'marital_status',
        label: 'Marital Status',
        type: 'selection',
        cols: 3,
        options: [
          { label: 'Single', value: 'Single' },
          { label: 'Married', value: 'Married' },
          { label: 'Divorced', value: 'Divorced' },
          { label: 'Widowed', value: 'Widowed' },
        ],
      },
      { name: 'nationality', label: 'Nationality', type: 'text', cols: 3 },
      { name: 'aadhar_no', label: 'Aadhar Number', type: 'text', cols: 3 },
      { name: 'pan_no', label: 'PAN Card Number', type: 'text', cols: 3 },
      { name: 'passport_number', label: 'Passport Number', type: 'text', cols: 3 },
      { name: 'bank_account_number', label: 'Bank Account Number', type: 'text', cols: 3 },
      { name: 'uan', label: 'UAN / PF Number', type: 'text', cols: 3 },
      { name: 'esic_number', label: 'ESIC Number', type: 'text', cols: 3 },
      { name: 'emergency_contact', label: 'Emergency Contact Phone', type: 'text', cols: 3 },
      { name: 'contact_person_name', label: 'Emergency Contact Person', type: 'text', cols: 3 },
      { name: 'contact_relation', label: 'Emergency Contact Relation', type: 'text', cols: 3 },
    ],
  },

  users: {
    model: 'users',
    title: 'User',
    endpoint: '/users',
    fields: [
      { name: 'name', label: 'User Full Name', type: 'text', required: true, cols: 2 },
      { name: 'login', label: 'Login Username / Identifier', type: 'text', required: true, cols: 2 },
      { name: 'password', label: 'Password (leave blank to keep unchanged)', type: 'text', cols: 1 },
    ],
  },

  crm: {
    model: 'crm_lead',
    title: 'CRM Lead / Opportunity',
    endpoint: '/crm',
    fields: [
      { name: 'name', label: 'Lead / Opportunity Name', type: 'text', required: true, cols: 2 },
      {
        name: 'type',
        label: 'Type',
        type: 'selection',
        required: true,
        default: 'lead',
        cols: 2,
        options: [
          { label: 'Lead', value: 'lead' },
          { label: 'Opportunity', value: 'opportunity' },
        ],
      },
      { name: 'expected_revenue', label: 'Expected Revenue', type: 'number', cols: 2 },
      {
        name: 'company_id',
        label: 'Company',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'Company',
          endpoint: '/company/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'currency_id',
        label: 'Currency',
        type: 'many2one',
        required: true,
        cols: 3,
        relation: {
          model: 'Currency',
          endpoint: '/currency/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'partner_id',
        label: 'Customer / Partner',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'Partner',
          endpoint: '/partner/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'lead_status',
        label: 'Lead Status',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'LeadStatus',
          endpoint: '/lead_status/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      {
        name: 'opportunity_status',
        label: 'Opportunity Status',
        type: 'many2one',
        cols: 3,
        relation: {
          model: 'OpportunityStatus',
          endpoint: '/opportunity_status/view/all',
          value_field: 'id',
          label_field: 'name',
        },
      },
      { name: 'email', label: 'Email', type: 'text', cols: 3 },
      { name: 'phone', label: 'Phone', type: 'text', cols: 3 },
      { name: 'pan', label: 'PAN Number', type: 'text', cols: 3 },
      { name: 'reference', label: 'Reference Code', type: 'text', cols: 3 },
      { name: 'expected_closing_date', label: 'Expected Closing Date', type: 'date', cols: 3 },
      { name: 'notes', label: 'Internal Notes', type: 'textarea', rows: 4, cols: 1 },
    ],
  },

  leadStatus: {
    model: 'lead_status',
    title: 'Lead Status',
    endpoint: '/lead_status',
    fields: [
      { name: 'name', label: 'Stage Name', type: 'text', required: true, cols: 2 },
      { name: 'sequence', label: 'Sequence / Order', type: 'number', cols: 2 },
      { name: 'fold', label: 'Folded in Kanban', type: 'boolean', cols: 2 },
      { name: 'is_won', label: 'Won Stage', type: 'boolean', cols: 2 },
    ],
  },

  opportunityStatus: {
    model: 'opportunity_status',
    title: 'Opportunity Status',
    endpoint: '/opportunity_status',
    fields: [
      { name: 'name', label: 'Stage Name', type: 'text', required: true, cols: 2 },
      { name: 'sequence', label: 'Sequence / Order', type: 'number', cols: 2 },
      { name: 'fold', label: 'Folded in Kanban', type: 'boolean', cols: 2 },
      { name: 'is_won', label: 'Won Stage', type: 'boolean', cols: 2 },
    ],
  },

  salesTeam: {
    model: 'sales_team',
    title: 'Sales Team',
    endpoint: '/sales_team',
    fields: [
      { name: 'name', label: 'Team Name', type: 'text', required: true, cols: 2 },
      {
        name: 'team_member_id',
        label: 'Team Member',
        type: 'many2one',
        cols: 2,
        relation: {
          model: 'Users',
          endpoint: '/view/users',
          value_field: 'id',
          label_field: 'name',
        },
      },
    ],
  },
};
