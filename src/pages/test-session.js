import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';

export default function TestSession({ serverSession }) {
  const { data: clientSession, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Session Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Client Session (useSession)</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Status:</strong> {status}</p>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(clientSession, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Server Session (getServerSession)</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(serverSession, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  console.log('🧪 Test Session SSR - checking session...');
  
  const session = await getServerSession(context.req, context.res, authOptions);
  
  console.log('🔍 Test session result:', { 
    hasSession: !!session, 
    userId: session?.user?.id,
    userEmail: session?.user?.email 
  });

  return {
    props: {
      serverSession: session || null,
    },
  };
}
