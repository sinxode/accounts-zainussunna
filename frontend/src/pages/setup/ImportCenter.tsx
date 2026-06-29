import React, { useState } from 'react';
import { 
  Download, 
  AlertCircle, 
  CheckCircle2,
  X,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import styles from './ImportCenter.module.scss';
import toast from 'react-hot-toast';

export const ImportCenter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // Mock parsing logic
      setPreviewData([
        { id: 1, name: 'Zubair Ahmed', enrolment: 'ZLS-102', status: 'valid' },
        { id: 2, name: 'Mustafa Kamal', enrolment: 'ZLS-103', status: 'valid' },
        { id: 3, name: 'Ali Khan', enrolment: 'ZLS-104', status: 'duplicate' },
      ]);
      toast.success('CSV parsed successfully');
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Student Import Center" 
        subtitle="Batch upload student records via CSV/Excel."
        actions={<Button variant="soft" icon={<Download size={18} />}>Download Template</Button>}
      />

      <div className={styles.container}>
        {!file ? (
          <Card className={styles.dropzone} padding="xl">
            <input type="file" id="file" hidden onChange={handleFileChange} accept=".csv,.xlsx" />
            <label htmlFor="file" className={styles.label}>
              <div className={styles.iconArea}>
                <UploadCloud size={48} />
              </div>
              <h3>Drag & drop your file here</h3>
              <p>Supports .csv, .xlsx (Max 5MB)</p>
              <Button variant="primary" className="mt-6">Choose File</Button>
            </label>
          </Card>
        ) : (
          <div className={styles.previewView}>
            <div className={styles.fileHeader}>
              <div className={styles.fileInfo}>
                <FileSpreadsheet size={24} className="text-primary" />
                <div>
                  <h4>{file.name}</h4>
                  <span>{(file.size / 1024).toFixed(1)} KB — Ready to import</span>
                </div>
              </div>
              <button className={styles.removeBtn} onClick={() => { setFile(null); setPreviewData([]); }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.validationRow}>
              <div className={styles.vItem}>
                <span>Rows Detected</span>
                <strong>42</strong>
              </div>
              <div className={styles.vDivider} />
              <div className={styles.vItem}>
                <span>Valid Records</span>
                <strong className="text-success">41</strong>
              </div>
              <div className={styles.vDivider} />
              <div className={styles.vItem}>
                <span>Errors / Duplicates</span>
                <strong className="text-danger">1</strong>
              </div>
            </div>

            <Card padding="none" className={styles.tableCard}>
              <DataTable 
                columns={[
                  { header: 'Student Name', accessor: 'name' },
                  { header: 'Enrollment #', accessor: 'enrolment' },
                  { 
                    header: 'Validation', 
                    accessor: (d) => (
                      <Badge variant={d.status === 'valid' ? 'success' : 'danger'} size="sm">
                        {d.status.toUpperCase()}
                      </Badge>
                    ) 
                  },
                  { 
                    header: 'Notes', 
                    accessor: (d) => d.status === 'duplicate' ? 'Enrolment already exists' : 'Ready' 
                  },
                ]}
                data={previewData}
              />
            </Card>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => { setFile(null); setPreviewData([]); }}>Cancel</Button>
              <Button size="lg" icon={<ArrowRight size={18} />} iconPosition="right">Execute Global Import</Button>
            </div>
          </div>
        )}

        <section className={styles.guide}>
          <h3 className="label-sm mb-4">Import Guidelines</h3>
          <div className={styles.guideGrid}>
            <div className={styles.gItem}>
              <CheckCircle2 size={18} className="text-success" />
              <p>Column 1 must be <strong>Student Name</strong></p>
            </div>
            <div className={styles.gItem}>
              <CheckCircle2 size={18} className="text-success" />
              <p>Column 2 must be <strong>Enrolment ID</strong> (Unique)</p>
            </div>
            <div className={styles.gItem}>
              <AlertCircle size={18} className="text-warning" />
              <p>Duplicates will be skipped automatically.</p>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};
