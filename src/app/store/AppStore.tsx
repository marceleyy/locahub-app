import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  seedUsers, seedProperties, seedLeases, seedApplications, seedPayments,
  seedTickets, seedVisits, seedProspects, seedInventories,
  seedAudit, seedMarket, seedFinancialHistory,
} from "@/app/data/seed";
import {
  seedBuildings, seedEconomics, seedProviders, seedTasks,
  seedEvents, seedInvoices, seedPortals, seedListings,
} from "@/app/data/seedOps";
import { optimistic, tempId, replaceTempId, isTempId } from "@/app/store/optimistic";
import { enqueue as enqueueOp } from "@/app/lib/syncQueue";
import {
  seedReceipts, seedDunningLog, seedRenewals, seedJobs, seedThreads, seedMailboxes,
} from "@/app/data/seedNext";

/**
 * Couche de données unique de l'application.
 * En production, remplacer les fonctions de mutation par des appels API :
 * la signature (createUser, updateUser, deleteUser…) reste identique côté écrans.
 */

const STORAGE_KEY = "locahub.db.v4";

function buildInitialState() {
  return {
    users: seedUsers,
    properties: seedProperties,
    leases: seedLeases,
    applications: seedApplications,
    payments: seedPayments,
    tickets: seedTickets,
    visits: seedVisits,
    prospects: seedProspects,
    inventories: seedInventories,
    audit: seedAudit,
    market: seedMarket,
    financialHistory: seedFinancialHistory,
    buildings: seedBuildings,
    economics: seedEconomics,
    providers: seedProviders,
    tasks: seedTasks,
    events: seedEvents,
    invoices: seedInvoices,
    portals: seedPortals,
    listings: seedListings,
    inspections: [],
    receipts: seedReceipts,
    dunningLog: seedDunningLog,
    renewals: seedRenewals,
    jobs: seedJobs,
    threads: seedThreads,
    mailboxes: seedMailboxes,
  };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    // Fusion défensive : une nouvelle clé du seed ne casse pas une sauvegarde ancienne
    return { ...buildInitialState(), ...parsed };
  } catch {
    return buildInitialState();
  }
}

const AppContext = createContext<any>(null);

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<any>(loadState);

  /**
   * Référence toujours à jour vers l'état courant.
   * L'instantané d'une mutation optimiste doit être pris au moment de l'appel,
   * pas au moment où la closure a été créée : sans cette référence, deux
   * mutations enchaînées restaureraient un état périmé.
   */
  const dbRef = useRef(db);
  dbRef.current = db;
  const [currentUserId, setCurrentUserId] = useState<string>("u-admin-1");

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* quota / mode privé : l'app continue en mémoire */
    }
  }, [db]);

  const log = useCallback((action: string, target: string, detail: any) => {
    setDb((prev: any) => ({
      ...prev,
      audit: [
        { id: newId("au"), at: new Date().toISOString().slice(0, 16), actorId: currentUserId, action, target, detail, ip: "local" },
        ...prev.audit,
      ].slice(0, 200),
    }));
  }, [currentUserId]);

  const api = useMemo(() => {
    // ---------- Lecture ----------
    const usersByRole = (role: string) => db.users.filter((u: any) => u.role === role);
    const getUser = (id: string) => db.users.find((u: any) => u.id === id) || null;
    const getProperty = (id: string) => db.properties.find((p: any) => p.id === id) || null;
    const propertiesOfOwner = (ownerId: string) => db.properties.filter((p: any) => p.ownerId === ownerId);
    const propertiesOfAgent = (agentId: string) => db.properties.filter((p: any) => p.agentId === agentId);
    const applicationsOfProperty = (propertyId: string) => db.applications.filter((a: any) => a.propertyId === propertyId);
    const applicationsOfTenant = (tenantId: string) => db.applications.filter((a: any) => a.tenantId === tenantId);
    const leaseOfTenant = (tenantId: string) => db.leases.find((l: any) => l.tenantId === tenantId) || null;
    const paymentsOfLease = (leaseId: string) => db.payments.filter((p: any) => p.leaseId === leaseId);
    const ticketsOfProperty = (propertyId: string) => db.tickets.filter((t: any) => t.propertyId === propertyId);

    const byMarket = (list: any[], market?: string) => (market ? list.filter((x: any) => x.market === market) : list);

    // ---------- Lecture : exploitation ----------
    const getBuilding = (id: string) => db.buildings.find((b: any) => b.id === id) || null;
    const buildingOfProperty = (propertyId: string) => db.buildings.find((b: any) => b.unitIds.includes(propertyId)) || null;
    const unitsOfBuilding = (buildingId: string) => {
      const b = getBuilding(buildingId);
      return b ? db.properties.filter((p: any) => b.unitIds.includes(p.id)) : [];
    };
    const tasksOfProperty = (propertyId: string) => db.tasks.filter((t: any) => t.propertyId === propertyId);
    const tasksOfAssignee = (userId: string) => db.tasks.filter((t: any) => t.assigneeId === userId);
    const invoicesOfProperty = (propertyId: string) => db.invoices.filter((i: any) => i.propertyId === propertyId);
    const invoicesOfProvider = (providerId: string) => db.invoices.filter((i: any) => i.providerId === providerId);
    const getProvider = (id: string) => db.providers.find((p: any) => p.id === id) || null;
    const listingsOfProperty = (propertyId: string) => db.listings.filter((l: any) => l.propertyId === propertyId);
    const economicsOf = (propertyId: string) => db.economics[propertyId] || null;

    /**
     * Acteur courant d'un espace, filtré sur le marché affiché.
     * En production, ce serait l'utilisateur authentifié ; en démonstration,
     * on retombe sur le premier acteur du marché pour que les écrans réagissent
     * au sélecteur France / Québec.
     */
    // ---------- Lecture : vague 2 ----------
    const receiptsOfLease = (leaseId: string) => db.receipts.filter((r: any) => r.leaseId === leaseId);
    const receiptOfPayment = (paymentId: string) => db.receipts.find((r: any) => r.paymentId === paymentId) || null;
    const dunningOfPayment = (paymentId: string) => db.dunningLog.filter((d: any) => d.paymentId === paymentId);
    const renewalOfLease = (leaseId: string) => db.renewals.find((r: any) => r.leaseId === leaseId && r.status !== "cancelled") || null;
    const jobsOfProvider = (providerId: string) => db.jobs.filter((j: any) => j.providerId === providerId);
    const jobsOfProperty = (propertyId: string) => db.jobs.filter((j: any) => j.propertyId === propertyId);
    const getJob = (id: string) => db.jobs.find((j: any) => j.id === id) || null;
    const threadsOfUser = (userId: string) =>
      db.threads.filter((t: any) => (t.participantIds || []).includes(userId));
    const threadsOfProperty = (propertyId: string) => db.threads.filter((t: any) => t.propertyId === propertyId);
    const getThread = (id: string) => db.threads.find((t: any) => t.id === id) || null;
    const mailboxOf = (userId: string) => db.mailboxes.find((m: any) => m.userId === userId) || null;

    const activeUserOfRole = (role: string, market?: string) => {
      const me = getUser(currentUserId);
      if (me?.role === role && (!market || me.market === market)) return me;
      return db.users.find((u: any) => u.role === role && (!market || u.market === market)) || null;
    };
    const leasesOfOwner = (ownerId: string) => db.leases.filter((l: any) => l.ownerId === ownerId);
    const paymentsOfTenant = (tenantId: string) => db.payments.filter((p: any) => p.tenantId === tenantId);
    const paymentsOfOwner = (ownerId: string) => {
      const ids = leasesOfOwner(ownerId).map((l: any) => l.id);
      return db.payments.filter((p: any) => ids.includes(p.leaseId));
    };

    // ---------- Écriture : utilisateurs ----------
    const createUser = (data: any) => {
      const user = {
        id: newId(`u-${data.role || "user"}`),
        status: "active",
        createdAt: new Date().toISOString().slice(0, 10),
        locale: "fr",
        avatarColor: ["#60a5fa", "#ff8c42", "#34d399", "#a78bfa", "#fbbf24"][Math.floor(Math.random() * 5)],
        documents: [],
        ...data,
      };
      setDb((prev: any) => ({ ...prev, users: [user, ...prev.users] }));
      log("create_user", user.id, { fr: `Création du compte ${user.firstName} ${user.lastName}`, en: `Created account ${user.firstName} ${user.lastName}` });
      return user;
    };

    const updateUser = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, users: prev.users.map((u: any) => (u.id === id ? { ...u, ...patch } : u)) }));
      log("update_user", id, { fr: "Modification d'un compte", en: "Account updated" });
    };

    const deleteUser = (id: string) => {
      setDb((prev: any) => ({ ...prev, users: prev.users.filter((u: any) => u.id !== id) }));
      log("delete_user", id, { fr: "Suppression d'un compte (droit à l'effacement)", en: "Account deleted (right to erasure)" });
    };

    const suspendUser = (id: string) => {
      setDb((prev: any) => ({
        ...prev,
        users: prev.users.map((u: any) => (u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u)),
      }));
      log("suspend_user", id, { fr: "Changement de statut du compte", en: "Account status changed" });
    };

    // ---------- Écriture : biens ----------
    const createProperty = (data: any) => {
      const property = {
        id: newId("p"),
        status: "available",
        images: [],
        features: [],
        ratings: { insulation: 0, noise: 0, cleanliness: 0, landlord: 0, neighborhood: 0, overall: 0 },
        reviewCount: 0, likes: 0, comments: 0, views: 0,
        legal: { diagnostics: {} },
        utilities: {},
        ...data,
      };
      setDb((prev: any) => ({ ...prev, properties: [property, ...prev.properties] }));
      log("create_property", property.id, { fr: `Ajout du bien ${property.title}`, en: `Property added: ${property.title}` });
      return property;
    };

    const updateProperty = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, properties: prev.properties.map((p: any) => (p.id === id ? { ...p, ...patch } : p)) }));
      log("update_property", id, { fr: "Modification d'un bien", en: "Property updated" });
    };

    const deleteProperty = (id: string) => {
      setDb((prev: any) => ({ ...prev, properties: prev.properties.filter((p: any) => p.id !== id) }));
      log("delete_property", id, { fr: "Suppression d'un bien", en: "Property deleted" });
    };

    // ---------- Écriture : divers ----------
    const createApplication = (data: any) => {
      const app = { id: newId("a"), status: "sent", createdAt: new Date().toISOString().slice(0, 10), humanReviewed: false, ...data };
      setDb((prev: any) => ({ ...prev, applications: [app, ...prev.applications] }));
      return app;
    };

    const updateApplication = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, applications: prev.applications.map((a: any) => (a.id === id ? { ...a, ...patch } : a)) }));
      log("update_application", id, { fr: "Décision sur une candidature", en: "Application decision" });
    };

    const createTicket = (data: any) => {
      const ticket = { id: newId("t"), status: "open", createdAt: new Date().toISOString().slice(0, 10), ...data };
      setDb((prev: any) => ({ ...prev, tickets: [ticket, ...prev.tickets] }));
      return ticket;
    };

    const updateTicket = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, tickets: prev.tickets.map((t: any) => (t.id === id ? { ...t, ...patch } : t)) }));
    };

    const createProspect = (data: any) => {
      const prospect = { id: newId("pr"), stage: "new", createdAt: new Date().toISOString().slice(0, 10), ...data };
      setDb((prev: any) => ({ ...prev, prospects: [prospect, ...prev.prospects] }));
      return prospect;
    };

    const updateProspect = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, prospects: prev.prospects.map((p: any) => (p.id === id ? { ...p, ...patch } : p)) }));
    };

    const createVisit = (data: any) => {
      const visit = { id: newId("v"), status: "pending", ...data };
      setDb((prev: any) => ({ ...prev, visits: [visit, ...prev.visits] }));
      return visit;
    };

    // ---------- Écriture : tâches ----------
    const createTask = (data: any) => {
      const task = { id: newId("t"), status: "todo", comments: [], legal: false, blocksRental: false, tenantImpact: "low", amount: 0, ...data };
      setDb((prev: any) => ({ ...prev, tasks: [task, ...prev.tasks] }));
      log("create_task", task.id, { fr: "Création d'une tâche", en: "Task created" });
      return task;
    };
    const updateTask = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, tasks: prev.tasks.map((t: any) => (t.id === id ? { ...t, ...patch } : t)) }));
    };
    const deleteTask = (id: string) => {
      setDb((prev: any) => ({ ...prev, tasks: prev.tasks.filter((t: any) => t.id !== id) }));
      log("delete_task", id, { fr: "Suppression d'une tâche", en: "Task deleted" });
    };
    /** Transfert à un collègue : la tâche reste « proposée » tant qu'il n'a pas accepté. */
    const transferTask = (id: string, toUserId: string, note?: string) => {
      setDb((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) =>
          t.id === id ? { ...t, transfer: { to: toUserId, from: currentUserId, at: new Date().toISOString().slice(0, 10), note: note || "", state: "pending" } } : t
        ),
      }));
      log("transfer_task", id, { fr: "Proposition de transfert de tâche", en: "Task transfer proposed" });
    };
    const answerTransfer = (id: string, accept: boolean) => {
      setDb((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) => {
          if (t.id !== id || !t.transfer) return t;
          return accept
            ? { ...t, assigneeId: t.transfer.to, transfer: { ...t.transfer, state: "accepted" } }
            : { ...t, transfer: { ...t.transfer, state: "declined" } };
        }),
      }));
      log("answer_transfer", id, { fr: accept ? "Transfert accepté" : "Transfert refusé", en: accept ? "Transfer accepted" : "Transfer declined" });
    };
    const addTaskComment = (id: string, text: any) => {
      setDb((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) =>
          t.id === id ? { ...t, comments: [...(t.comments || []), { at: new Date().toISOString().slice(0, 10), by: currentUserId, text }] } : t
        ),
      }));
    };

    // ---------- Écriture : agenda ----------
    const createEvent = (data: any) => {
      const ev = { id: newId("e"), kind: "meeting", ownerId: currentUserId, ...data };
      setDb((prev: any) => ({ ...prev, events: [...prev.events, ev] }));
      return ev;
    };
    const deleteEvent = (id: string) => setDb((prev: any) => ({ ...prev, events: prev.events.filter((e: any) => e.id !== id) }));
    /** Accepte un créneau proposé : crée le rendez-vous ET planifie la tâche. */
    const acceptSlot = (slot: any, title: any) => {
      const ev = { id: newId("e"), date: slot.date, start: slot.start, end: slot.end, title, kind: "task", propertyId: null, ownerId: currentUserId, taskId: slot.taskId };
      setDb((prev: any) => ({
        ...prev,
        events: [...prev.events, ev],
        tasks: prev.tasks.map((t: any) => (t.id === slot.taskId ? { ...t, scheduledAt: `${slot.date} ${slot.start}` } : t)),
      }));
      return ev;
    };

    // ---------- Écriture : prestataires ----------
    const createProvider = (data: any) => {
      const pr = { id: newId("pr"), rating: 0, onTimeRate: 1, jobsCompleted: 0, trades: [], ...data };
      setDb((prev: any) => ({ ...prev, providers: [pr, ...prev.providers] }));
      log("create_provider", pr.id, { fr: `Ajout du prestataire ${pr.name}`, en: `Provider ${pr.name} added` });
      return pr;
    };
    const updateProvider = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, providers: prev.providers.map((p: any) => (p.id === id ? { ...p, ...patch } : p)) }));
    };
    const deleteProvider = (id: string) => {
      setDb((prev: any) => ({ ...prev, providers: prev.providers.filter((p: any) => p.id !== id) }));
      log("delete_provider", id, { fr: "Suppression d'un prestataire", en: "Provider deleted" });
    };

    // ---------- Écriture : factures ----------
    const createInvoice = (data: any) => {
      const inv = { id: newId("f"), status: "unpaid", recoverable: false, date: new Date().toISOString().slice(0, 10), ...data };
      setDb((prev: any) => ({ ...prev, invoices: [inv, ...prev.invoices] }));
      return inv;
    };
    const updateInvoice = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, invoices: prev.invoices.map((i: any) => (i.id === id ? { ...i, ...patch } : i)) }));
    };

    // ---------- Écriture : diffusion d'annonces ----------
    const publishListing = (propertyId: string, portalId: string) => {
      setDb((prev: any) => {
        const existing = prev.listings.find((l: any) => l.propertyId === propertyId && l.portalId === portalId);
        if (existing) {
          return { ...prev, listings: prev.listings.map((l: any) => (l.id === existing.id ? { ...l, status: "published", publishedAt: new Date().toISOString().slice(0, 10) } : l)) };
        }
        return { ...prev, listings: [...prev.listings, { id: newId("l"), propertyId, portalId, status: "published", publishedAt: new Date().toISOString().slice(0, 10), views: 0, leads: 0 }] };
      });
      log("publish_listing", propertyId, { fr: `Diffusion sur ${portalId}`, en: `Published on ${portalId}` });
    };
    const unpublishListing = (propertyId: string, portalId: string) => {
      setDb((prev: any) => ({
        ...prev,
        listings: prev.listings.map((l: any) => (l.propertyId === propertyId && l.portalId === portalId ? { ...l, status: "withdrawn" } : l)),
      }));
      log("unpublish_listing", propertyId, { fr: `Retrait de ${portalId}`, en: `Withdrawn from ${portalId}` });
    };

    /**
     * Exécute une mutation optimiste sur le store.
     *
     * Les mutations existantes restent synchrones et inchangées. Celle-ci sert
     * de passerelle pour le jour où `commit` appellera une API : les écrans
     * appellent déjà `mutate(...)` et n'auront rien à changer.
     */
    const mutate = <T,>(options: any) =>
      optimistic<T>(() => dbRef.current, setDb, options);

    /** Création optimiste : l'enregistrement apparaît tout de suite, marqué en vol. */
    const createOptimistic = (collection: string, data: any, commit?: () => Promise<any>) => {
      const id = tempId(collection.slice(0, 2));
      const record = { id, _pending: !!commit, ...data };
      mutate({
        apply: (prev: any) => ({ ...prev, [collection]: [record, ...(prev[collection] || [])] }),
        commit,
        reconcile: (prev: any, result: any) => ({
          ...prev,
          [collection]: replaceTempId(prev[collection], id, result?.id ?? id),
        }),
      }).catch(() => {
        /* l'instantané a déjà été restauré, l'appelant décide de l'affichage */
      });
      return record;
    };

    // ---------- Lecture : états des lieux ----------
    const getInspection = (id: string) => db.inspections.find((x: any) => x.id === id) || null;
    const inspectionsOfProperty = (propertyId: string) => db.inspections.filter((x: any) => x.propertyId === propertyId);
    const openInspections = (userId: string) =>
      db.inspections.filter((x: any) => x.agentId === userId && x.status === "draft");

    // ---------- Écriture : états des lieux ----------
    /**
     * Toutes les écritures d'un état des lieux sont locales et immédiates.
     * L'agent ne doit jamais attendre : ce qu'il saisit dans un sous-sol est
     * enregistré dans le store, et l'envoi part dans la file de synchronisation
     * qui se videra au retour du réseau.
     */
    const startInspection = (data: any) => {
      const inspection = {
        id: newId("insp"),
        status: "draft",
        createdAt: new Date().toISOString(),
        agentId: currentUserId,
        rooms: [],
        ...data,
      };
      setDb((prev: any) => ({ ...prev, inspections: [inspection, ...prev.inspections] }));
      enqueueOp("inspection.start", { id: inspection.id, propertyId: inspection.propertyId, type: inspection.type });
      log("start_inspection", inspection.id, { fr: "État des lieux démarré", en: "Condition report started" });
      return inspection;
    };

    /** Mise à jour d'un élément : la plus fréquente, donc la plus légère. */
    const rateInspectionItem = (inspectionId: string, itemId: string, patch: any) => {
      setDb((prev: any) => ({
        ...prev,
        inspections: prev.inspections.map((insp: any) =>
          insp.id !== inspectionId
            ? insp
            : {
                ...insp,
                updatedAt: new Date().toISOString(),
                rooms: insp.rooms.map((room: any) => ({
                  ...room,
                  items: room.items.map((it: any) => (it.id === itemId ? { ...it, ...patch } : it)),
                })),
              }
        ),
      }));
      // Une photo ajoutée déclenche une opération par média : la file les
      // enverra un par un, ce qui permet de reprendre au bon endroit après
      // une coupure au milieu d'un lot.
      const photos = patch.photos as any[] | undefined;
      if (photos?.length) {
        const last = photos[photos.length - 1];
        enqueueOp("inspection.photo", { inspectionId, itemId, name: last.name }, last.fileId);
      } else {
        enqueueOp("inspection.item", { inspectionId, itemId, ...patch });
      }
    };

    const deleteInspection = (id: string) => {
      setDb((prev: any) => ({ ...prev, inspections: prev.inspections.filter((x: any) => x.id !== id) }));
      log("delete_inspection", id, { fr: "État des lieux supprimé", en: "Condition report deleted" });
    };

    /**
     * Verrouillage : le rapport devient non modifiable et rejoint la file.
     * Aucune attente réseau — le verrouillage est un fait local, la
     * transmission en est la conséquence différée.
     */
    const lockInspection = (id: string, summary: any) => {
      const lockedAt = new Date().toISOString();
      setDb((prev: any) => ({
        ...prev,
        inspections: prev.inspections.map((x: any) =>
          x.id === id ? { ...x, status: "locked", lockedAt, lockedBy: currentUserId, summary } : x
        ),
      }));
      enqueueOp("inspection.lock", { id, lockedAt, summary });
      log("lock_inspection", id, { fr: "Rapport verrouillé", en: "Report locked" });
      return lockedAt;
    };

    // ---------- Écriture : dossier locataire ----------
    /**
     * Ajoute une pièce et recalcule la complétude.
     * La complétude est dérivée, jamais saisie : elle ne peut pas mentir.
     */
    const addTenantDocument = (userId: string, doc: any) => {
      const id = newId("d");
      setDb((prev: any) => ({
        ...prev,
        users: prev.users.map((u: any) => {
          if (u.id !== userId) return u;
          const documents = [...(u.documents || []), { id, addedAt: new Date().toISOString().slice(0, 10), ...doc }];
          return { ...u, documents, fileCompleteness: completenessOf(documents) };
        }),
      }));
      enqueueOp("tenant.document", { userId, docId: id, label: doc.label }, doc.fileId);
      log("add_document", userId, { fr: `Pièce ajoutée : ${doc.label}`, en: `Document added: ${doc.label}` });
      return id;
    };

    const removeTenantDocument = (userId: string, docId: string) => {
      setDb((prev: any) => ({
        ...prev,
        users: prev.users.map((u: any) => {
          if (u.id !== userId) return u;
          const documents = (u.documents || []).filter((d: any) => d.id !== docId);
          return { ...u, documents, fileCompleteness: completenessOf(documents) };
        }),
      }));
      log("remove_document", userId, { fr: "Pièce retirée du dossier", en: "Document removed from file" });
    };

    // ---------- Écriture : quittances ----------
    /** Idempotent : une quittance par paiement, régénérable sans doublon. */
    const issueReceipt = (payment: any, lease: any, market: string) => {
      const existing = db.receipts.find((r: any) => r.paymentId === payment.id);
      if (existing) return existing;
      const d = new Date(payment.dueDate);
      const reference = `Q-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}-${payment.id.slice(-4).toUpperCase()}`;
      const receipt = {
        id: newId("rc"), paymentId: payment.id, leaseId: lease.id, tenantId: payment.tenantId,
        propertyId: lease.propertyId, market, reference, amount: payment.amount,
        rent: lease.rent, charges: lease.charges,
        periodStart: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
        periodEnd: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
        issuedAt: new Date().toISOString().slice(0, 10),
      };
      setDb((prev: any) => ({
        ...prev,
        receipts: [receipt, ...prev.receipts],
        payments: prev.payments.map((p: any) => (p.id === payment.id ? { ...p, receiptId: reference } : p)),
      }));
      log("issue_receipt", receipt.id, { fr: `Quittance ${reference} émise`, en: `Receipt ${reference} issued` });
      return receipt;
    };

    // ---------- Écriture : relances ----------
    const recordDunning = (paymentId: string, stepId: string, channel: string, body: string) => {
      const entry = {
        id: newId("dn"), paymentId, stepId, channel, body,
        sentAt: new Date().toISOString().slice(0, 10), sentBy: currentUserId,
      };
      setDb((prev: any) => ({ ...prev, dunningLog: [entry, ...prev.dunningLog] }));
      log("send_dunning", paymentId, { fr: `Relance « ${stepId} » envoyée`, en: `Dunning step "${stepId}" sent` });
      return entry;
    };

    /**
     * Relance optimiste : la ligne apparaît « envoyée » immédiatement, le
     * transport part en tâche de fond. En cas d'échec, `optimistic()` restaure
     * l'instantané pris avant la mutation — la ligne disparaît d'elle-même.
     */
    const sendDunning = (payment: any, stepId: string, channel: string, body: string, commit: () => Promise<any>) => {
      const id = tempId("dn");
      const entry = {
        id, paymentId: payment.id, stepId, channel, body,
        sentAt: new Date().toISOString().slice(0, 10), sentBy: currentUserId, _pending: true,
      };
      return mutate({
        apply: (prev: any) => ({ ...prev, dunningLog: [entry, ...prev.dunningLog] }),
        commit,
        reconcile: (prev: any, result: any) => ({
          ...prev,
          dunningLog: prev.dunningLog.map((d: any) =>
            d.id === id ? { ...d, id: result?.id ?? id, trackingId: result?.trackingId, _pending: false } : d
          ),
        }),
        onSuccess: () => log("send_dunning", payment.id, { fr: `Relance « ${stepId} » envoyée`, en: `Dunning step "${stepId}" sent` }),
      });
    };

    /**
     * Transmission d'une quittance. La quittance reste émise en cas d'échec —
     * elle existe juridiquement dès sa génération — seul l'horodatage d'envoi
     * est annulé par le retour arrière.
     */
    const sendReceipt = (receiptId: string, channel: string, commit: () => Promise<any>) =>
      mutate({
        apply: (prev: any) => ({
          ...prev,
          receipts: prev.receipts.map((r: any) =>
            r.id === receiptId
              ? { ...r, sentAt: new Date().toISOString().slice(0, 10), sentChannel: channel, _pending: true }
              : r
          ),
        }),
        commit,
        reconcile: (prev: any, result: any) => ({
          ...prev,
          receipts: prev.receipts.map((r: any) =>
            r.id === receiptId ? { ...r, _pending: false, deliveryId: result?.id } : r
          ),
        }),
        onSuccess: () => log("send_receipt", receiptId, { fr: "Quittance transmise", en: "Receipt delivered" }),
      });

    // ---------- Écriture : renouvellement ----------
    const createRenewal = (data: any) => {
      const renewal = {
        id: newId("rn"), status: "proposed", createdAt: new Date().toISOString().slice(0, 10),
        createdBy: currentUserId, ...data,
      };
      setDb((prev: any) => ({
        ...prev,
        renewals: [renewal, ...prev.renewals.filter((r: any) => r.leaseId !== data.leaseId || r.status === "cancelled")],
      }));
      log("create_renewal", renewal.id, { fr: "Proposition de renouvellement émise", en: "Renewal proposal issued" });
      return renewal;
    };
    const updateRenewal = (id: string, patch: any) => {
      setDb((prev: any) => ({ ...prev, renewals: prev.renewals.map((r: any) => (r.id === id ? { ...r, ...patch } : r)) }));
    };
    /** Applique la proposition au bail : la seule opération qui modifie le loyer. */
    const applyRenewal = (id: string) => {
      setDb((prev: any) => {
        const renewal = prev.renewals.find((r: any) => r.id === id);
        if (!renewal) return prev;
        return {
          ...prev,
          renewals: prev.renewals.map((r: any) => (r.id === id ? { ...r, status: "applied", appliedAt: new Date().toISOString().slice(0, 10) } : r)),
          leases: prev.leases.map((l: any) =>
            l.id === renewal.leaseId
              ? { ...l, rent: renewal.newRent, endDate: renewal.newEndDate, status: "active" }
              : l
          ),
        };
      });
      log("apply_renewal", id, { fr: "Renouvellement appliqué au bail", en: "Renewal applied to the lease" });
    };

    // ---------- Écriture : interventions prestataires ----------
    const assignJob = (data: any) => {
      const job = {
        id: newId("jb"), status: "offered", offeredAt: new Date().toISOString().slice(0, 10),
        offeredBy: currentUserId, ...data,
      };
      setDb((prev: any) => ({ ...prev, jobs: [job, ...prev.jobs] }));
      log("assign_job", job.id, { fr: "Intervention proposée à un prestataire", en: "Job offered to a provider" });
      return job;
    };
    const answerJob = (id: string, accept: boolean, note?: string) => {
      setDb((prev: any) => ({
        ...prev,
        jobs: prev.jobs.map((j: any) =>
          j.id === id
            ? { ...j, status: accept ? "accepted" : "declined", answeredAt: new Date().toISOString().slice(0, 10), providerNote: note || "" }
            : j
        ),
      }));
      log("answer_job", id, { fr: accept ? "Intervention acceptée" : "Intervention refusée", en: accept ? "Job accepted" : "Job declined" });
    };
    const completeJob = (id: string) => {
      setDb((prev: any) => ({
        ...prev,
        jobs: prev.jobs.map((j: any) => (j.id === id ? { ...j, status: "completed", completedAt: new Date().toISOString().slice(0, 10) } : j)),
      }));
    };
    /** Dépôt de facture par le prestataire : alimente directement le comparateur du gestionnaire. */
    const submitJobInvoice = (jobId: string, data: any) => {
      const job = db.jobs.find((j: any) => j.id === jobId);
      if (!job) return null;
      const invoice = {
        id: newId("f"), jobId, providerId: job.providerId, propertyId: job.propertyId,
        market: job.market, status: "unpaid", recoverable: false,
        date: new Date().toISOString().slice(0, 10), submittedBy: "provider", ...data,
      };
      setDb((prev: any) => ({
        ...prev,
        invoices: [invoice, ...prev.invoices],
        jobs: prev.jobs.map((j: any) => (j.id === jobId ? { ...j, status: "invoiced", invoiceId: invoice.id } : j)),
      }));
      log("submit_invoice", invoice.id, { fr: "Facture déposée par le prestataire", en: "Invoice submitted by the provider" });
      return invoice;
    };

    // ---------- Écriture : messagerie ----------
    const createThread = (data: any) => {
      const thread = {
        id: newId("th"), createdAt: new Date().toISOString().slice(0, 10),
        channel: "internal", messages: [], participantIds: [], ...data,
      };
      setDb((prev: any) => ({ ...prev, threads: [thread, ...prev.threads] }));
      return thread;
    };
    const postMessage = (threadId: string, body: string, attachments: any[] = [], channel = "internal") => {
      const message = {
        id: newId("ms"), from: currentUserId, body, attachments, channel,
        at: new Date().toISOString().slice(0, 16), read: false,
      };
      setDb((prev: any) => ({
        ...prev,
        threads: prev.threads.map((t: any) =>
          t.id === threadId ? { ...t, messages: [...t.messages, message], lastAt: message.at } : t
        ),
      }));
      return message;
    };
    const markThreadRead = (threadId: string) => {
      setDb((prev: any) => ({
        ...prev,
        threads: prev.threads.map((t: any) =>
          t.id === threadId
            ? { ...t, messages: t.messages.map((mg: any) => (mg.from === currentUserId ? mg : { ...mg, read: true })) }
            : t
        ),
      }));
    };
    const updateMailbox = (userId: string, patch: any) => {
      setDb((prev: any) => {
        const exists = prev.mailboxes.some((m: any) => m.userId === userId);
        return {
          ...prev,
          mailboxes: exists
            ? prev.mailboxes.map((m: any) => (m.userId === userId ? { ...m, ...patch } : m))
            : [...prev.mailboxes, { userId, ...patch }],
        };
      });
      log("update_mailbox", userId, { fr: "Réglages de messagerie modifiés", en: "Mailbox settings updated" });
    };

    const resetDemo = () => {
      const fresh = buildInitialState();
      setDb(fresh);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    };

    return {
      db,
      currentUserId,
      setCurrentUserId,
      currentUser: getUser(currentUserId),
      usersByRole, getUser, getProperty, propertiesOfOwner, propertiesOfAgent,
      applicationsOfProperty, applicationsOfTenant, leaseOfTenant, paymentsOfLease,
      ticketsOfProperty, byMarket,
      createUser, updateUser, deleteUser, suspendUser,
      createProperty, updateProperty, deleteProperty,
      createApplication, updateApplication,
      createTicket, updateTicket,
      createProspect, updateProspect, createVisit,
      resetDemo, log,
      getBuilding, buildingOfProperty, unitsOfBuilding,
      tasksOfProperty, tasksOfAssignee, invoicesOfProperty, invoicesOfProvider,
      getProvider, listingsOfProperty, economicsOf,
      activeUserOfRole, leasesOfOwner, paymentsOfTenant, paymentsOfOwner,
      receiptsOfLease, receiptOfPayment, dunningOfPayment, renewalOfLease,
      jobsOfProvider, jobsOfProperty, getJob,
      threadsOfUser, threadsOfProperty, getThread, mailboxOf,
      getInspection, inspectionsOfProperty, openInspections,
      startInspection, rateInspectionItem, lockInspection, deleteInspection,
      addTenantDocument, removeTenantDocument,
      issueReceipt, recordDunning, sendDunning, sendReceipt,
      createRenewal, updateRenewal, applyRenewal,
      assignJob, answerJob, completeJob, submitJobInvoice,
      createThread, postMessage, markThreadRead, updateMailbox,
      mutate, createOptimistic, isTempId,
      createTask, updateTask, deleteTask, transferTask, answerTransfer, addTaskComment,
      createEvent, deleteEvent, acceptSlot,
      createProvider, updateProvider, deleteProvider,
      createInvoice, updateInvoice,
      publishListing, unpublishListing,
    };
  }, [db, currentUserId, log]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useStore doit être utilisé à l'intérieur de <AppStoreProvider>");
  return ctx;
}

// ---------- Utilitaires métier réutilisables ----------

/** Score de compatibilité locataire ↔ logement (0-100). Explicable, sans « boîte noire ». */
/**
 * Complétude d'un dossier locataire.
 *
 * Cinq pièces structurent un dossier : identité, domicile, activité, ressources
 * et fiscalité. Une pièce vérifiée compte double d'une pièce en attente — un
 * dossier plein de scans douteux n'est pas un dossier complet.
 */
export function completenessOf(documents: any[] = []): number {
  const core = ["id", "address", "employment", "income", "tax"];
  const held = new Map<string, boolean>();
  documents.forEach((d: any) => {
    if (!held.get(d.type)) held.set(d.type, !!d.verified);
    else held.set(d.type, held.get(d.type) || !!d.verified);
  });
  const points = core.reduce((acc, key) => {
    if (!held.has(key)) return acc;
    return acc + (held.get(key) ? 2 : 1);
  }, 0);
  return Math.min(100, Math.round((points / (core.length * 2)) * 100));
}

export function matchScore(tenant: any, property: any) {
  if (!tenant || !property) return 0;
  const monthlyIncome = tenant.incomePeriod === "year" ? tenant.income / 12 : tenant.income;
  const totalRent = property.rent + (property.charges || 0);
  const ratio = monthlyIncome / Math.max(totalRent, 1);

  const factors = [
    { key: "income", label: { fr: "Revenu / loyer", en: "Income / rent" }, weight: 40, value: Math.min(ratio / 3, 1) },
    { key: "file", label: { fr: "Complétude du dossier", en: "File completeness" }, weight: 25, value: (tenant.fileCompleteness || 0) / 100 },
    { key: "guarantor", label: { fr: "Garant / endosseur", en: "Guarantor" }, weight: 15, value: tenant.hasGuarantor ? 1 : 0.4 },
    { key: "stability", label: { fr: "Stabilité professionnelle", en: "Job stability" }, weight: 20, value: /CDI|permanent/i.test(tenant.employmentType || "") ? 1 : 0.6 },
  ];

  const total = factors.reduce((acc, f) => acc + f.weight * f.value, 0);
  return { score: Math.round(total), factors };
}

/** Écart entre le loyer demandé et la médiane locale, en %. */
export function marketGap(property: any) {
  if (!property?.marketMedian) return 0;
  return Math.round(((property.rent - property.marketMedian) / property.marketMedian) * 1000) / 10;
}

/** Vérifie la conformité d'un bien selon les règles du marché. Retourne une liste d'anomalies. */
export function complianceCheck(property: any, market: any) {
  const issues: any[] = [];
  if (!property || !market) return issues;

  // Règle énergétique
  if (market.energy.banned?.includes(property.energy?.grade)) {
    issues.push({
      level: "blocking", key: "energy",
      fr: `Classe ${property.energy.grade} : mise en location interdite.`,
      en: `Class ${property.energy.grade}: letting is prohibited.`,
    });
  }
  const soon = market.energy.bannedSoon?.find((b: any) => b.grade === property.energy?.grade);
  if (soon) {
    issues.push({
      level: "warning", key: "energy_soon",
      fr: `Classe ${property.energy.grade} : interdiction de location au ${soon.date.split("-").reverse().join("/")}. Loyer déjà gelé.`,
      en: `Class ${property.energy.grade}: letting ban from ${soon.date}. Rent already frozen.`,
    });
  }

  // Diagnostics / documents manquants
  const diags = property.legal?.diagnostics || {};
  market.mandatoryDocs?.forEach((doc: any) => {
    const provided = diags[doc.id] ?? diags[doc.id.replace("_", "")];
    if (provided === undefined) return; // document non suivi pour ce bien
    if (provided === null) {
      issues.push({ level: "warning", key: doc.id, fr: `${doc.fr} : manquant ou non renseigné.`, en: `${doc.en}: missing or not recorded.` });
    }
  });

  // Dépôt de garantie
  if (!market.deposit.allowed && (property.deposit || 0) > 0) {
    issues.push({ level: "blocking", key: "deposit", fr: "Dépôt de garantie interdit sur ce marché.", en: "Security deposit prohibited in this market." });
  }
  if (market.deposit.allowed) {
    const max = property.furnished ? market.deposit.maxMonthsFurnished : market.deposit.maxMonthsUnfurnished;
    if ((property.deposit || 0) > property.rent * max) {
      issues.push({ level: "blocking", key: "deposit", fr: `Dépôt supérieur au plafond légal (${max} mois de loyer hors charges).`, en: `Deposit above the legal cap (${max} months' rent excl. charges).` });
    }
  }

  // Encadrement des loyers (France)
  if (property.legal?.rentControlZone && property.legal?.referenceRentIncreased) {
    const maxRent = property.legal.referenceRentIncreased * property.area;
    if (property.rent - (property.legal.rentSupplement || 0) > maxRent) {
      issues.push({ level: "blocking", key: "rent_control", fr: "Loyer supérieur au loyer de référence majoré.", en: "Rent above the increased reference rent." });
    }
  }

  // Section G (Québec)
  const g = property.legal?.sectionG;
  if (g && !g.declared) {
    issues.push({ level: "blocking", key: "section_g", fr: "Section G non déclarée : le locataire peut demander la fixation du loyer au TAL.", en: "Section G not disclosed: the tenant may apply to the TAL for rent setting." });
  }

  return issues;
}
