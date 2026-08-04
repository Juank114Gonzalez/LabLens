import { Role } from '@prisma/client';
import {
  createCompanyContact,
  deleteCompanyContact,
  getCompanyContactOrThrow,
  listCompanyContactsByInitiative,
  updateCompanyContact,
} from '../repositories/company-contact.repository.js';
import { getInitiativeOrThrow } from '../repositories/domain-initiative.repository.js';
import type {
  CreateCompanyContactDto,
  UpdateCompanyContactDto,
} from '../validators/company-contact.validator.js';

async function assertInitiativeAccess(
  initiativeId: string,
  actor: { id: string; role: Role },
) {
  return getInitiativeOrThrow(initiativeId, {
    userId: actor.id,
    isAdmin: actor.role === Role.ADMIN || actor.role === Role.EVALUATOR,
  });
}

export async function createContactForActor(
  actor: { id: string; role: Role },
  input: CreateCompanyContactDto,
) {
  await assertInitiativeAccess(input.initiativeId, actor);
  return createCompanyContact(input);
}

export async function listContactsForInitiative(
  initiativeId: string,
  actor: { id: string; role: Role },
) {
  await assertInitiativeAccess(initiativeId, actor);
  return listCompanyContactsByInitiative(initiativeId);
}

export async function updateContactForActor(
  id: string,
  actor: { id: string; role: Role },
  input: UpdateCompanyContactDto,
) {
  const contact = await getCompanyContactOrThrow(id);
  await assertInitiativeAccess(contact.initiativeId, actor);
  return updateCompanyContact(id, input);
}

export async function deleteContactForActor(
  id: string,
  actor: { id: string; role: Role },
) {
  const contact = await getCompanyContactOrThrow(id);
  await assertInitiativeAccess(contact.initiativeId, actor);
  await deleteCompanyContact(id);
}
