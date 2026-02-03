/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LandingPage } from '@/app/(landing-page)/components/landing-page';

// Mock child components to avoid deep rendering issues or missing dependencies
jest.mock('@/app/(landing-page)/components/nav', () => ({
  Nav: () => <nav data-testid="nav">Nav</nav>,
}));
jest.mock('@/app/(landing-page)/components/footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe('LandingPage', () => {
  it('renders the main heading', () => {
    render(<LandingPage />);
    const heading = screen.getByRole('heading', { name: /Seu curso online/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the "Entre em contato" link', () => {
    render(<LandingPage />);
    const link = screen.getByRole('link', { name: /Entre em contato/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/contato');
  });

  it('renders Nav and Footer components', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
