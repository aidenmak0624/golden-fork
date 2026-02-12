/**
 * Chef's Choice API
 *
 * GET  /api/admin/chefs-choice  — Retrieve today's chef's choice items
 * POST /api/admin/chefs-choice  — Set today's chef's choice items (owner only)
 *
 * Persists to a local JSON file so data survives server restarts.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChefsChoiceItem {
  id: string;
  name: string;
  description: string;
  reason: string; // Why the chef picked this today
}

interface ChefsChoice {
  date: string; // YYYY-MM-DD
  items: ChefsChoiceItem[];
  message: string; // Chef's personal message
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'chefs-choice.json');

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function loadChefsChoice(): ChefsChoice | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw) as ChefsChoice;
    }
  } catch {
    // ignore read errors
  }
  return null;
}

function saveChefsChoice(data: ChefsChoice): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save chefs-choice.json:', err);
  }
}

export async function GET() {
  const stored = loadChefsChoice();

  // Return today's chef's choice (or empty if not set / outdated)
  if (stored && stored.date === getTodayDate()) {
    return NextResponse.json(stored);
  }

  return NextResponse.json({
    date: getTodayDate(),
    items: [],
    message: '',
    updatedAt: '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one chef\'s choice item is required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of body.items) {
      if (!item.name) {
        return NextResponse.json(
          { error: 'Each item must have a name' },
          { status: 400 }
        );
      }
    }

    const chefsChoice: ChefsChoice = {
      date: getTodayDate(),
      items: body.items.map((item: ChefsChoiceItem, idx: number) => ({
        id: item.id || `chef-${idx + 1}`,
        name: item.name,
        description: item.description || '',
        reason: item.reason || '',
      })),
      message: body.message || '',
      updatedAt: new Date().toISOString(),
    };

    saveChefsChoice(chefsChoice);

    return NextResponse.json(chefsChoice);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update chef\'s choice' },
      { status: 500 }
    );
  }
}
