/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PermissionsMatrix } from '@/app/[tenant]/(modules)/settings/components/permissions-matrix';
import { RolePermissions } from '@/app/shared/types/entities/papel';

const mockPermissions: RolePermissions = {
  dashboard: { view: true },
  cursos: { view: true, create: false, edit: false, delete: false },
  disciplinas: { view: true, create: false, edit: false, delete: false },
  alunos: { view: true, create: false, edit: false, delete: false },
  usuarios: { view: false, create: false, edit: false, delete: false },
  agendamentos: { view: true, create: true, edit: true, delete: true },
  flashcards: { view: true, create: true, edit: true, delete: true },
  materiais: { view: true, create: true, edit: true, delete: true },
  configuracoes: { view: false, edit: false },
  branding: { view: false, edit: false },
  relatorios: { view: false },
};

describe('PermissionsMatrix', () => {
  it('renders resource labels', () => {
    render(<PermissionsMatrix permissions={mockPermissions} />);
    expect(screen.getByText('Cursos')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('calls onChange when a checkbox is clicked', () => {
    const handleChange = jest.fn();
    render(<PermissionsMatrix permissions={mockPermissions} onChange={handleChange} />);

    // Find the "Criar Cursos" checkbox. It's false initially.
    // We use aria-label since we set it in the component.
    const createCursosCheckbox = screen.getByLabelText('Criar Cursos');
    expect(createCursosCheckbox).not.toBeChecked();

    fireEvent.click(createCursosCheckbox);

    expect(handleChange).toHaveBeenCalledTimes(1);

    // Check if the payload is correct
    // We expect the entire permissions object back with the change
    const expectedPermissions = {
      ...mockPermissions,
      cursos: {
        ...mockPermissions.cursos,
        create: true
      }
    };

    expect(handleChange).toHaveBeenCalledWith(expectedPermissions);
  });

  it('disables checkboxes when readonly is true', () => {
    render(<PermissionsMatrix permissions={mockPermissions} readonly />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    checkboxes.forEach(cb => {
      expect(cb).toBeDisabled();
    });
  });
});
