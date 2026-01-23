import {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
} from "baileys";
import { initAuthCreds } from "baileys";
import JSONB from "json-buffer";
import { BatchOperation, Level } from "level";

let db: Level<string, string>;

export const createLevelDbAuthState = async (
  location: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  if (db === undefined) {
    db = new Level(location, {
      valueEncoding: "utf8",
    });

    await db.open();
  }

  const dbCreds = await db.get("creds");
  const creds: AuthenticationCreds = dbCreds
    ? JSONB.parse(dbCreds)
    : initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const keys = ids.map((id) => `${type}-${id}`);
          const values = await db.getMany(keys);

          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};

          for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const value = values[i];

            if (value) {
              data[id] = JSONB.parse(value);
            }
          }

          return data;
        },
        set: async (data) => {
          const tasks: BatchOperation<typeof db, string, string>[] = [];
          const keys = Object.keys(data) as (keyof SignalDataTypeMap)[];

          for (const category of keys) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;

              if (value) {
                tasks.push({
                  key,
                  value: JSONB.stringify(value),
                  type: "put",
                });
              } else {
                tasks.push({
                  key,
                  type: "del",
                });
              }
            }
          }

          await db.batch(tasks);
        },
        clear() {
          return db.clear();
        },
      },
    },
    saveCreds: async () => {
      return db.put("creds", JSONB.stringify(creds));
    },
  };
};
