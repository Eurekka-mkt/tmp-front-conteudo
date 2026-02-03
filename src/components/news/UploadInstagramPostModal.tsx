import { useState } from "react";
import ReactDropdown from "react-dropdown";
import 'react-dropdown/style.css';
import { DeveloperAccount, useDeveloperAccounts } from "../../hooks/useDeveloperAccounts";
import { Loader } from "lucide-react";

interface PublicPostModalProperties {
    postId: string
    onClose: () => void
}

export function UploadInstagramPostModal({postId, onClose}:PublicPostModalProperties) {
  
  const [selectedAccount, setSelectedAccount] = useState('')
  const {createIgPost, data} = useDeveloperAccounts({limit: 9999})

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-12">
      <div className="bg-white p-12 rounded space-y-3 ">
          <h3>
              Selecione a conta para publicar
          </h3>

          <h1>⚠️ Atenção! Essa ação irá realizar um Post no Instagram</h1>

          {data ? <ReactDropdown
            placeholder={'Selecione a conta'}
            options={data.map(da => ({value: da.id, label: da.slug}))}
            value={selectedAccount}
            onChange={(value) => setSelectedAccount(value.value)}

          /> : <Loader/>}
          
          <div className="flex justify-between mt-5">
            <button
              className="text-red-600"
              onClick={onClose}
            >
              Fechar
            </button>
            <button
              onClick={() => createIgPost({id: selectedAccount, postId: postId})}
              className="bg-pink-400 p-2 rounded-lg shadow-md shadow-pink-500 text-white font-bold"
            >
              Publicar
            </button>
          </div>
      </div>
    </div>
  );
  }