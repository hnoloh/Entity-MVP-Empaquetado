import React, { useState, useEffect } from 'react';
import { generatedArtifactAccessResolver } from '../../domain/tools/generated-artifacts';
import type { GeneratedArtifactDownloadDescriptor, GeneratedArtifactOpenDescriptor } from '../../domain/tools/generated-artifacts';

interface Props {
  artifactId: string;
  entiId: string;
  text?: string;
}

export const GeneratedArtifactActions: React.FC<Props> = ({ artifactId, entiId, text }) => {
  const [downloadDesc, setDownloadDesc] = useState<GeneratedArtifactDownloadDescriptor | null>(null);
  const [openDesc, setOpenDesc] = useState<GeneratedArtifactOpenDescriptor | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let revokeFn: (() => void) | undefined;
    
    Promise.resolve().then(() => {
      try {
        const desc = generatedArtifactAccessResolver.resolveDownload(artifactId, entiId);
        if (active) setDownloadDesc(desc);
        
        const { descriptor, revoke } = generatedArtifactAccessResolver.resolveOpen(artifactId, entiId);
        if (active) {
          setOpenDesc(descriptor);
          revokeFn = revoke;
        } else {
          revoke();
        }
      } catch (e: unknown) {
        if (active) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          setError(msg);
        }
      }
    });
    
    return () => {
      active = false;
      if (revokeFn) revokeFn();
    };
  }, [artifactId, entiId]);

  if (error) {
    return <span style={{ color: 'red', fontSize: '0.8rem' }}>[Error de acceso: {error}]</span>;
  }

  if (downloadDesc && openDesc) {
    const handleDownload = async (e: React.MouseEvent) => {
      import('../../utils/isTauri').then(async ({ checkIsTauri }) => {
        if (checkIsTauri()) {
          e.preventDefault();
          try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const filePath = await save({ defaultPath: downloadDesc.filename });
            if (!filePath) return;
            
            const response = await fetch(openDesc.objectUrl);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            await writeFile(filePath, new Uint8Array(buffer));
          } catch (err) {
            console.error('Failed native download', err);
            alert('Error descargando archivo: ' + err);
          }
        }
      });
    };

    return (
      <a 
        href={openDesc.objectUrl} 
        download={downloadDesc.filename}
        onClick={handleDownload}
        style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}
        title={`Descargar ${downloadDesc.filename}`}
      >
        {text || downloadDesc.filename}
      </a>
    );
  }

  return <span style={{ color: '#888' }}>{text || 'Cargando archivo...'}</span>;
};

