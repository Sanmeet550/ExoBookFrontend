import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companyService } from '../services/resources/companyService';

const CompanyContext = createContext(null);

const STORAGE_ACTIVE_COMPANY_KEY = 'exobook_active_company_id';
const STORAGE_SELECTED_COMPANIES_KEY = 'exobook_selected_company_ids';

/**
 * CompanyProvider
 * 
 * Centralized global company context:
 * - Fetches all available companies dynamically from Company Master API (/company/view/all)
 * - Manages activeCompany (primary reference ID and full object)
 * - Supports Odoo-style multi-selection (allowed/active branches)
 * - Persists selection across page reloads via localStorage
 * - Seamlessly accessible across forms, headers, and pages
 */
export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_ACTIVE_COMPANY_KEY);
    return saved ? Number(saved) : null;
  });
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SELECTED_COMPANIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch companies from API
  const refreshCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const list = await companyService.getAll();
      const validList = Array.isArray(list) ? list : [];
      setCompanies(validList);

      if (validList.length > 0) {
        // Validate or fallback activeCompanyId
        const exists = validList.some((c) => c.id === activeCompanyId);
        if (!exists) {
          const defaultCompany = validList[0];
          setActiveCompanyId(defaultCompany.id);
          setSelectedCompanyIds([defaultCompany.id]);
          localStorage.setItem(STORAGE_ACTIVE_COMPANY_KEY, String(defaultCompany.id));
          localStorage.setItem(STORAGE_SELECTED_COMPANIES_KEY, JSON.stringify([defaultCompany.id]));
        } else if (selectedCompanyIds.length === 0) {
          setSelectedCompanyIds([activeCompanyId]);
          localStorage.setItem(STORAGE_SELECTED_COMPANIES_KEY, JSON.stringify([activeCompanyId]));
        }
      }
    } catch (err) {
      console.warn('Failed to load companies in CompanyContext:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, selectedCompanyIds]);

  useEffect(() => {
    refreshCompanies();
  }, []);

  // Switch primary active company
  const switchCompany = useCallback((companyId) => {
    const idNum = Number(companyId);
    setActiveCompanyId(idNum);
    localStorage.setItem(STORAGE_ACTIVE_COMPANY_KEY, String(idNum));

    setSelectedCompanyIds((prev) => {
      const updated = prev.includes(idNum) ? prev : [...prev, idNum];
      localStorage.setItem(STORAGE_SELECTED_COMPANIES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle company in multi-company selection mode
  const toggleCompanySelection = useCallback((companyId) => {
    const idNum = Number(companyId);
    setSelectedCompanyIds((prev) => {
      let updated;
      if (prev.includes(idNum)) {
        // Don't allow unchecking if it's the only one selected
        if (prev.length <= 1) return prev;
        updated = prev.filter((id) => id !== idNum);
        // If unchecking the active company, switch active to the next available selected
        if (idNum === activeCompanyId) {
          const nextActive = updated[0];
          setActiveCompanyId(nextActive);
          localStorage.setItem(STORAGE_ACTIVE_COMPANY_KEY, String(nextActive));
        }
      } else {
        updated = [...prev, idNum];
      }
      localStorage.setItem(STORAGE_SELECTED_COMPANIES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [activeCompanyId]);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || (companies.length > 0 ? companies[0] : null);

  const contextValue = {
    companies,
    activeCompany,
    activeCompanyId: activeCompany?.id || activeCompanyId,
    selectedCompanyIds,
    loading,
    switchCompany,
    toggleCompanySelection,
    refreshCompanies,
  };

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

export default CompanyContext;

