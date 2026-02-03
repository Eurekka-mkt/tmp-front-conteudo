import { useCallback, useEffect, useState } from 'react';
import { useApi } from './useApi';

/* =========================
   GraphQL
========================= */

const LIST_DEVELOPER_ACCOUNTS_QUERY = `
  query ListDeveloperAccounts($offset: Int, $limit: Int, $search: String) {
    listDeveloperAccounts(offset: $offset, limit: $limit, search: $search) {
      data {
        id
        slug
        shortApiKey
        igUserId
        apiKey
        pageId
        createdAt
        updatedAt
      }
      pageInfo {
        currentPage
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const CREATE_DEVELOPER_ACCOUNT_MUTATION = `
  mutation CreateDeveloperAccount($developerAccount: developerAccountInput) {
    createDeveloperAccount(developerAccount: $developerAccount)
  }
`;

const EDIT_DEVELOPER_ACCOUNT_MUTATION = `
  mutation EditDeveloperAccount($id: ID!, $developerAccount: developerAccountInput) {
    editDeveloperAccount(id: $id, developerAccount: $developerAccount)
  }
`;

const REMOVE_DEVELOPER_ACCOUNT_MUTATION = `
  mutation RemoveDeveloperAccount($id: ID!) {
    removeDeveloperAccount(id: $id)
  }
`;

const CHECK_VALIDITY_AND_SAVE_USER_IG = `
mutation CheckValidity($checkValidityAndSaveIgUserIdId: ID!) {
  checkValidityAndSaveIgUserId(id: $checkValidityAndSaveIgUserIdId)
}
`
const GENERATE_LONG_LIVE_TOKEN = `
mutation change($id: ID!, $secretKey: String) {
  changeTokenForLongLived(id: $id, secretKey: $secretKey)
}
`
const CREATE_IG_POST = `
mutation CreateInstagramPost($id: ID!, $postId: ID!) {
  createInstagramPost(id: $id, postId: $postId)
}
`
/* =========================
   Types
========================= */

export interface DeveloperAccount {
  id: string;
  slug: string;
  shortApiKey: string;
  apiKey: string;
  pageId: string;
  igUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UseDeveloperAccountsOptions {
  limit?: number;
  search?: string;
}

export interface DeveloperAccountInput {
  slug?: string;
  shortApiKey?: string;
}

/* =========================
   Hook
========================= */

export function useDeveloperAccounts(
  options: UseDeveloperAccountsOptions = {}
) {
  const { limit = 5, search = '' } = options;
  const { query } = useApi();

  const [data, setData] = useState<DeveloperAccount[]>([]);
  const [pageInfo, setPageInfo] = useState<PaginationInfo | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAccounts = useCallback(
    async (newOffset: number = 0) => {
      setLoading(true);
      try {
        const result = await query(
          LIST_DEVELOPER_ACCOUNTS_QUERY,
          { offset: newOffset, limit, search },
          true
        );

        setData(result.listDeveloperAccounts.data);
        setPageInfo(result.listDeveloperAccounts.pageInfo);
        setOffset(newOffset);
      } finally {
        setLoading(false);
      }
    },
    [query, limit, search]
  );

  const createAccount = useCallback(
    async (developerAccount: DeveloperAccountInput) => {
      await query(
        CREATE_DEVELOPER_ACCOUNT_MUTATION,
        { developerAccount },
        true
      );
      await fetchAccounts(0);
    },
    [query, fetchAccounts]
  );

  const updateAccount = useCallback(
    async (id: string, developerAccount: DeveloperAccountInput) => {
      await query(
        EDIT_DEVELOPER_ACCOUNT_MUTATION,
        { id, developerAccount },
        true
      );
      await fetchAccounts(offset);
    },
    [query, fetchAccounts, offset]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await query(
        REMOVE_DEVELOPER_ACCOUNT_MUTATION,
        { id },
        true
      );
      await fetchAccounts(offset);
    },
    [query, fetchAccounts, offset]
  );

  const checkValidity = async ({id}:{id:string}) => {
    const resp = await query(
      CHECK_VALIDITY_AND_SAVE_USER_IG,
      {id},
      true
    )
    await fetchAccounts(offset) 
  }

  const generateLongApi = async ({id, secretKey}:{id:string, secretKey:string}) => {
    try {
      const resp = await query(
        GENERATE_LONG_LIVE_TOKEN,
        {id, secretKey},
      )
      await fetchAccounts(offset)
    } catch (ex) {
      alert('Erro ao gerar chave definitiva')
    }
  }
  
  const createIgPost = async ({id, postId}:{id:string, postId:string}) => {
    try {
      const resp = await query(
        CREATE_IG_POST,
        {id, postId},
      )
    } catch (ex) {
      alert('Erro ao gerar chave definitiva')
    }
  }

  useEffect(() => {
    fetchAccounts(0);
  }, [fetchAccounts]);

  return {
    data,
    pageInfo,
    offset,
    loading,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    checkValidity,
    generateLongApi,
    createIgPost
  };
}
