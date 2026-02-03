export function InstagramTokenInfoModal({ onClose }:{ onClose: () => void}) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white max-w-lg p-6 rounded space-y-3">
          <h3 className="text-lg font-semibold">Como obter o token da API do Instagram</h3>
  
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li>A conta do Instagram precisa ser <b>Creator ou Business</b>.</li>
            <li>A conta deve estar <b>conectada a uma Página do Facebook</b>.</li>
            <li>Crie ou use um App em <a className=" text-blue-700" href="https://developers.facebook.com" target="_blank"><b>developers.facebook.com</b></a>.</li>
            <li>No App, adicione <b>Instagram Graph API</b>.</li>
            <li>Gere um <b>User Access Token</b> com os escopos:<br />
              <code>instagram_basic, instagram_content_publish, pages_show_list</code>
            </li>
            <li>Use <code>/me/accounts</code> para obter o <b>Page Token</b>.</li>
            <li> Para Pegar o Page ID (da conta facebook assoiciada): Abrir a Página no Facebook → Configurações → Informações da Página → copiar o ID da Página</li>
          </ol>
  
          <p className="text-xs text-gray-600">
            ⚠️ O usuário precisa ter <b>Acesso total à Página</b>. Acesso parcial não funciona.
          </p>
  
          <div className="text-right">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }