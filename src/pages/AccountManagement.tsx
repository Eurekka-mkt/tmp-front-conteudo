import { useState } from "react";
import { useDeveloperAccounts } from "../hooks/useDeveloperAccounts";
import { InstagramTokenInfoModal } from "./InstagramTokenInfoModal";
import { SecretKeyModal } from "./secretKeyModal";

export function AccountManagement() {
  const {
    data,
    pageInfo,
    loading,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    checkValidity,
    generateLongApi
  } = useDeveloperAccounts({ limit: 5 });

  const [form, setForm] = useState({ slug: "", shortApiKey: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [secretKeyInputModalOpen, setSecretKeyInputModalOpen] = useState(false)
  const [secretKey, setSecretKey] = useState('')
  const [typingSecretKeyAccId, setTypingSecretKeyId] = useState('')

  const openCreateModal = () => {
    setForm({ slug: "", shortApiKey: "" });
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEditModal = (acc: any) => {
    setEditingId(acc.id);
    setForm({ slug: acc.slug, shortApiKey: acc.apiKey });
    setShowFormModal(true);
  };

  const submit = async () => {
    if (editingId) {
      await updateAccount(editingId, form);
    } else {
      await createAccount(form);
    }
    setShowFormModal(false);
    setEditingId(null);
    setForm({ slug: "", shortApiKey: "" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Developer Accounts</h2>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Novo
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Como gerar API Key e Page ID
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <p>Carregando...</p>}

      {/* Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left w-1/5">Nome</th>
              <th className="p-3 text-left w-2/5">API Key Temporária</th>
              <th className="p-3 text-left w-2/5">API Key Definitiva</th>
              <th className="p-3 text-left w-2/5">Page ID</th>
              <th className="p-3 text-left w-2/5">Instagram User Id</th>
              <th className="p-3 text-left w-1/5">Criado em</th>
              <th className="p-3 text-right w-1/5">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((acc) => (
              <tr key={acc.id} className="border-t">
                <td className="p-3">{acc.slug}</td>
                <td className="p-3 font-mono text-xs truncate">
                  {acc.shortApiKey}
                </td>
                <td className="p-3 font-mono text-xs truncate">
                  {acc.apiKey ?? 'Não definida'}
                </td>
                <td className="p-3 font-mono text-xs truncate">
                  {acc.pageId}
                </td>
                <td className="p-3 font-mono text-xs truncate">
                  {acc.igUserId}
                </td>
                <td className="p-3">
                  {new Date(acc.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right space-x-3">
                  <div className="flex flex-col items-end">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="text-blue-600 hover:underline shadow-md p-2 rounded-lg hover:shadow-none"
                    >
                      Editar
                    </button>
                    {!acc.igUserId && <button
                      onClick={async () => await checkValidity({id: acc.id})}
                      className="text-blue-600 hover:underline shadow-md p-2 rounded-lg hover:shadow-none"
                    >
                      {acc.igUserId ? "User ig já recuperado" : "Recuperar user instagram"}
                    </button>}

                    {!acc.apiKey && <button
                      onClick={() => { setTypingSecretKeyId(acc.id); setSecretKeyInputModalOpen(true)}}
                      className="text-blue-600 hover:underline shadow-md p-2 rounded-lg hover:shadow-none"
                    >
                      Gerar Api Key definitiva
                    </button>}
                    <button
                      onClick={() => { if (confirm('Tem certeza que deseja excluir?')) deleteAccount(acc.id) }}
                      className="text-red-600 hover:underline shadow-md p-2 rounded-lg hover:shadow-none"
                     >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageInfo && (
        <div className="flex justify-end items-center gap-3">
          <button
            disabled={!pageInfo.hasPreviousPage}
            onClick={() =>
              fetchAccounts((pageInfo.currentPage - 2) * 5)
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            ← Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {pageInfo.currentPage} de {pageInfo.totalPages}
          </span>

          <button
            disabled={!pageInfo.hasNextPage}
            onClick={() =>
              fetchAccounts(pageInfo.currentPage * 5)
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[420px] space-y-4">
            <h3 className="text-lg font-semibold">
              {editingId ? "Editar Developer Account" : "Criar Developer Account"}
            </h3>

            <input
              placeholder="Slug"
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value })
              }
              className="border p-2 rounded w-full"
            />

            <input
              placeholder="API Key Temporária"
              value={form.shortApiKey}
              onChange={(e) =>
                setForm({ ...form, shortApiKey: e.target.value })
              }
              className="border p-2 rounded w-full"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {editingId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <InstagramTokenInfoModal
          onClose={() => setShowHelpModal(false)}
        />
      )}

      {secretKeyInputModalOpen &&
        <SecretKeyModal
          onClose={() => setSecretKeyInputModalOpen(false)}
          text={secretKey}
          setText={(text) => setSecretKey(text)}
          callback={() => generateLongApi({id: typingSecretKeyAccId, secretKey: secretKey})} />}
    </div>
  );
}
