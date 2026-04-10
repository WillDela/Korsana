import { vi, describe, it, expect, beforeEach } from 'vitest';
import { userProfileAPI } from './userProfile';

// vi.hoisted runs before any import, so mockApi is available inside the vi.mock factory.
const mockApi = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  delete: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock('./client', () => ({
  default: mockApi,
  getErrorMessage: vi.fn(),
}));

describe('userProfileAPI contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: {} });
    mockApi.put.mockResolvedValue({ data: {} });
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.delete.mockResolvedValue({ data: {} });
  });

  it('getFullProfile → GET /profile', async () => {
    await userProfileAPI.getFullProfile();
    expect(mockApi.get).toHaveBeenCalledWith('/profile');
  });

  it('updateProfile → PUT /profile with data', async () => {
    const data = { display_name: 'Runner' };
    await userProfileAPI.updateProfile(data);
    expect(mockApi.put).toHaveBeenCalledWith('/profile', data);
  });

  it('changePassword → PUT /profile/password with {current_password, new_password}', async () => {
    await userProfileAPI.changePassword('old-pass', 'new-pass');
    expect(mockApi.put).toHaveBeenCalledWith('/profile/password', {
      current_password: 'old-pass',
      new_password: 'new-pass',
    });
  });

  it('changeEmail → PUT /profile/email with {current_password, new_email}', async () => {
    await userProfileAPI.changeEmail('my-pass', 'new@example.com');
    expect(mockApi.put).toHaveBeenCalledWith('/profile/email', {
      current_password: 'my-pass',
      new_email: 'new@example.com',
    });
  });

  it('deleteAccount → DELETE /profile', async () => {
    await userProfileAPI.deleteAccount();
    expect(mockApi.delete).toHaveBeenCalledWith('/profile');
  });
});
