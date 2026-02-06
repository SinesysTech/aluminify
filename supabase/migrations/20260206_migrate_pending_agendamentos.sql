-- Migrate all pending appointments to confirmed
UPDATE agendamentos 
SET 
  status = 'confirmado', 
  confirmado_em = NOW() 
WHERE status = 'pendente';
