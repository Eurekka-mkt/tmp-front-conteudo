import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface CoursePermissionsProps {
  course: {
    slug: string;
    title: string;
  };
}

type PermissionAction = 'grant' | 'revoke';
type EmailStatus = 'pending' | 'success' | 'error';

interface ProcessedEmail {
  email: string;
  status: EmailStatus;
  error?: string;
}

export function CoursePermissions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state as CoursePermissionsProps;
  
  const [emails, setEmails] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [action, setAction] = useState<PermissionAction | null>(null);
  const [processedEmails, setProcessedEmails] = useState<ProcessedEmail[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[\s,]+/)
      .map(email => email.trim())
      .filter(email => email.includes('@'));
  };

  const handleActionClick = (selectedAction: PermissionAction) => {
    const parsedEmails = parseEmails(emails);
    if (parsedEmails.length > 0) {
      setEmailList(parsedEmails);
      setAction(selectedAction);
      setStep(2);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmailList(prev => prev.filter(email => email !== emailToRemove));
  };

  const processEmails = async () => {
    setIsProcessing(true);
    const results: ProcessedEmail[] = [];

    for (const email of emailList) {
      try {
        const response = await fetch(`https://v2-ms-user-hu6qjqssfq-uc.a.run.app/users/${email}/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courses: action === 'grant' ? course.slug : `-${course.slug}`
          })
        });

        if (response.ok) {
          results.push({ email, status: 'success' });
        } else {
          results.push({ 
            email, 
            status: 'error',
            error: 'Failed to process permission'
          });
        }
      } catch (error) {
        results.push({ 
          email, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      setProcessedEmails([...results]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Permissões - {course.title}
          </h1>
        </div>

        {step === 1 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Emails dos usuários
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="Digite os emails separados por espaço ou vírgula"
                className="w-full h-32 px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg 
                         dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você pode separar os emails usando espaços ou vírgulas
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleActionClick('grant')}
                disabled={!emails.trim()}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Dar Permissão
              </button>
              <button
                onClick={() => handleActionClick('revoke')}
                disabled={!emails.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Remover Permissão
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className={`h-5 w-5 ${
                action === 'grant' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className="text-gray-700 dark:text-gray-300">
                {action === 'grant' ? 'Conceder' : 'Remover'} acesso para os seguintes emails:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {emailList.map((email) => (
                <div
                  key={email}
                  className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                             dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {processedEmails.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Status do Processamento
                </h3>
                <div className="space-y-2">
                  {processedEmails.map((processed, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      {processed.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`${
                        processed.status === 'success' 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {processed.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
            {  (!isProcessing) && <button
                onClick={() => {
                    setStep(1) 
                    setProcessedEmails([])
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 
                         transition-colors"
              >
                Voltar
              </button>}
             {  (processedEmails.length == 0) && <button
                onClick={processEmails}
                disabled={emailList.length === 0 || isProcessing || processedEmails.length > 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processando...' : 'Confirmar'}
              </button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}