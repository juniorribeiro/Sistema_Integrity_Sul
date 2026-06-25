'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidatosTab } from '@/components/curriculos/candidatos-tab';
import { VagasTab } from '@/components/curriculos/vagas-tab';

export default function CurriculosPage() {
  const [tab, setTab] = useState('candidatos');
  return (
    <>
      <PageHeader title="Banco de Currículos" description="Candidatos e processos seletivos" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
          <TabsTrigger value="vagas">Vagas & Pipeline</TabsTrigger>
        </TabsList>
        <TabsContent value="candidatos" className="mt-4">
          <CandidatosTab />
        </TabsContent>
        <TabsContent value="vagas" className="mt-4">
          <VagasTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
