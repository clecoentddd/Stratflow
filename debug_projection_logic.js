
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'db', 'initial-events.json');

// Mock tables
const table = new Map();
const teamMeta = new Map();
const strategyMeta = new Map();

// Mock handlers
const handlers = {};
function registerProjectionHandler(type, handler) {
    if (!handlers[type]) handlers[type] = [];
    handlers[type].push(handler);
}

// Helper functions from projection.ts (simplified)
function getTable() { return table; }
function getTeamMeta() { return teamMeta; }
function getStrategyMeta() { return strategyMeta; }

// --- COPIED LOGIC FROM projection.ts ---

function onInitiativeCreated(e) {
  const id = e.metadata?.initiativeId;
  if (!id) return;
  
  const teamId = e.aggregateId;
  const strategyId = e.payload?.strategyId;
  
  const row = {
    id,
    name: e.payload?.name,
    teamId,
    strategyId,
    status: 'NEW',
  };
  
  console.log(`[InitiativeCreated] ID: ${id}, Status: NEW`);
  table.set(id, row);
}

function onTeamCreated(e) {
  teamMeta.set(e.payload?.id, { name: e.payload?.name, level: e.payload?.level, companyId: e.payload?.companyId });
  console.log(`[TeamCreated] ID: ${e.payload?.id}, Company: ${e.payload?.companyId}`);
}

function onElementMoved(e) {
  if (e.payload?.elementType === 'initiative') {
    const id = e.payload?.elementId?.replace(/^initiative-/, '');
    const row = id ? table.get(id) : undefined;
    
    if (!row) {
      console.warn(`[ElementMoved] WARN: Initiative ${id} not found in catalog`);
      return;
    }
    
    console.log(`[ElementMoved] Updating status for initiative ${id} to ${e.payload.toStatus}`);
    row.status = e.payload.toStatus;
    table.set(id, row);
  }
}

// Register handlers
registerProjectionHandler('InitiativeCreated', onInitiativeCreated);
registerProjectionHandler('TeamCreated', onTeamCreated);
registerProjectionHandler('ElementMoved', onElementMoved);

// --- MAIN ---

function main() {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const events = JSON.parse(fileContent);
        
        console.log(`Processing ${events.length} events...`);
        
        for (const event of events) {
            const eventHandlers = handlers[event.type];
            if (eventHandlers) {
                for (const handler of eventHandlers) {
                    handler(event);
                }
            }
        }
        
        // Check specific initiative
        const targetId = 'init-socraft-77bef4ff-0d2a-451b-b63f-d5ede7d79eba';
        const row = table.get(targetId);
        
        console.log('\n--- RESULT ---');
        if (row) {
            console.log(`Initiative ${targetId}:`);
            console.log(`  Status: ${row.status}`);
            console.log(`  Team: ${row.teamId}`);
            const team = teamMeta.get(row.teamId);
            console.log(`  Company: ${team?.companyId}`);
        } else {
            console.log(`Initiative ${targetId} NOT FOUND.`);
        }

    } catch (e) {
        console.error(e);
    }
}

main();
