import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../pages/auth/SignUp';

const signupMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signup: signupMock }),
}));

function fillRequiredTextFields() {
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'nada_dev' } });
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nada Nashaat' } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'nada@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret1' } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'secret1' } });
}

describe('SignUp explicit choices', () => {
  beforeEach(() => {
    signupMock.mockReset();
  });

  it('rejects submission when date of birth and gender were never chosen', async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
    fillRequiredTextFields();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/please specify your date of birth/i)).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2003-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/please select your gender/i)).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('sends only explicitly chosen date of birth and gender', async () => {
    signupMock.mockResolvedValue({ data: {} });
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
    fillRequiredTextFields();
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2003-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Male' }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(signupMock).toHaveBeenCalledTimes(1));
    expect(signupMock).toHaveBeenCalledWith(
      expect.objectContaining({ dateOfBirth: '2003-06-15', gender: 'male' })
    );
  });
});
