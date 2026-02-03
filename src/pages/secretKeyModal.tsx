export function SecretKeyModal({ callback, onClose, text, setText }:{ callback: () => void, onClose: () => void, text: string, setText: (text:string) => void}) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-12">
        <div className="bg-white p-12 rounded space-y-3 ">

            <img src="https://gcdnb.pbrd.co/images/dl1VwIsn3XqY.png?o=1" width={900} height={600} alt="" />
            <h3 className="text-lg font-semibold">Insira a chave secreta encontrada em <a href="https://developers.facebook.com/apps" target="_blank" className="text-blue-500">https://developers.facebook.com/apps</a> configurações facebook business</h3>
            <input className=" border-black border-2 w-full rounded-md" type="text" value={text} onChange={(ev) => setText(ev.target.value)} />
  
            <div className="text-right mb-5">
                <button onClick={() => {callback(); onClose()}} className="px-4 py-2 mr-4 bg-green-600 text-white rounded">
                Gerar
                </button>
                <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded">
                Fechar
                </button>
            </div>
        </div>
      </div>
    );
  }