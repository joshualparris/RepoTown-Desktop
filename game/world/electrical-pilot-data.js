/* Generated from the merged RTU-003–005 version-1 design; do not hand-draw circuits. */
export const PILOT_NETWORK = Object.freeze({
  "schemaVersion": 1,
  "source": "repository-town/audit/electricity/design-network-v1.json; RTU-003–005",
  "kind": "synthetic_game_pilot_not_real_utility_gis",
  "siteIds": [
    "B:bakery",
    "B:butcher",
    "B:cafe",
    "B:greengrocer",
    "B:hotel",
    "B:post",
    "B:pub",
    "B:school",
    "B:store",
    "H:K7",
    "H:L7",
    "H:M7",
    "H:N7",
    "H:O7",
    "H:P7",
    "H:Q7"
  ],
  "sites": [
    {
      "id": "B:bakery",
      "address": "I8-S",
      "kind": "shop",
      "phase": "ABC",
      "serviceId": "SVC:B:bakery",
      "meterId": "MTR:B:bakery",
      "door": {
        "x": -117,
        "z": 168.5
      },
      "meterPosition": {
        "x": -115.75,
        "z": 168
      },
      "transformerId": "DIST-R8-B2",
      "connectedKva": 45,
      "connectionNode": "SWB:B:bakery"
    },
    {
      "id": "B:butcher",
      "address": "L8-S",
      "kind": "shop",
      "phase": "ABC",
      "serviceId": "SVC:B:butcher",
      "meterId": "MTR:B:butcher",
      "door": {
        "x": -39,
        "z": 168.5
      },
      "meterPosition": {
        "x": -37.75,
        "z": 168
      },
      "transformerId": "DIST-R8-B2",
      "connectedKva": 18,
      "connectionNode": "SWB:B:butcher"
    },
    {
      "id": "B:cafe",
      "address": "J8-S",
      "kind": "cafe",
      "phase": "ABC",
      "serviceId": "SVC:B:cafe",
      "meterId": "MTR:B:cafe",
      "door": {
        "x": -91,
        "z": 168.5
      },
      "meterPosition": {
        "x": -89.75,
        "z": 168
      },
      "transformerId": "DIST-R8-B2",
      "connectedKva": 18,
      "connectionNode": "SWB:B:cafe"
    },
    {
      "id": "B:greengrocer",
      "address": "K8-S",
      "kind": "shop",
      "phase": "ABC",
      "serviceId": "SVC:B:greengrocer",
      "meterId": "MTR:B:greengrocer",
      "door": {
        "x": -65,
        "z": 168.5
      },
      "meterPosition": {
        "x": -63.75,
        "z": 168
      },
      "transformerId": "DIST-R8-B2",
      "connectedKva": 18,
      "connectionNode": "SWB:B:greengrocer"
    },
    {
      "id": "B:hotel",
      "address": "I9-N",
      "kind": "hotel",
      "phase": "ABC",
      "serviceId": "SVC:B:hotel",
      "meterId": "MTR:B:hotel",
      "door": {
        "x": -117,
        "z": 184.5
      },
      "meterPosition": {
        "x": -115.75,
        "z": 185
      },
      "transformerId": "DIST-R8-B2",
      "connectedKva": 18,
      "connectionNode": "SWB:B:hotel"
    },
    {
      "id": "B:post",
      "address": "O8-S",
      "kind": "post",
      "phase": "ABC",
      "serviceId": "SVC:B:post",
      "meterId": "MTR:B:post",
      "door": {
        "x": 39,
        "z": 168.5
      },
      "meterPosition": {
        "x": 40.25,
        "z": 168
      },
      "transformerId": "DIST-R8-B3",
      "connectedKva": 18,
      "connectionNode": "SWB:B:post"
    },
    {
      "id": "B:pub",
      "address": "N8-S",
      "kind": "pub",
      "phase": "ABC",
      "serviceId": "SVC:B:pub",
      "meterId": "MTR:B:pub",
      "door": {
        "x": 13,
        "z": 168.5
      },
      "meterPosition": {
        "x": 14.25,
        "z": 168
      },
      "transformerId": "DIST-R8-B3",
      "connectedKva": 75,
      "connectionNode": "SWB:B:pub"
    },
    {
      "id": "B:school",
      "address": "P8-S",
      "kind": "school",
      "phase": "ABC",
      "serviceId": "SVC:B:school",
      "meterId": "MTR:B:school",
      "door": {
        "x": 65,
        "z": 168.5
      },
      "meterPosition": {
        "x": 66.25,
        "z": 168
      },
      "transformerId": "DIST-R8-B3",
      "connectedKva": 75,
      "connectionNode": "SWB:B:school"
    },
    {
      "id": "B:store",
      "address": "H8-S",
      "kind": "shop",
      "phase": "ABC",
      "serviceId": "SVC:B:store",
      "meterId": "MTR:B:store",
      "door": {
        "x": -143,
        "z": 168.5
      },
      "meterPosition": {
        "x": -141.75,
        "z": 168
      },
      "transformerId": "DIST-R8-B2",
      "connectedKva": 18,
      "connectionNode": "SWB:B:store"
    },
    {
      "id": "H:K7",
      "address": "K7-S",
      "kind": "repository-house",
      "phase": "B",
      "serviceId": "SVC:H:K7",
      "meterId": "MTR:H:K7",
      "door": {
        "x": -65,
        "z": 119
      },
      "meterPosition": {
        "x": -63.75,
        "z": 118.5
      },
      "transformerId": "DIST-R7-B2",
      "connectedKva": 5,
      "connectionNode": "SWB:H:K7"
    },
    {
      "id": "H:L7",
      "address": "L7-S",
      "kind": "repository-house",
      "phase": "C",
      "serviceId": "SVC:H:L7",
      "meterId": "MTR:H:L7",
      "door": {
        "x": -39,
        "z": 119
      },
      "meterPosition": {
        "x": -37.75,
        "z": 118.5
      },
      "transformerId": "DIST-R7-B2",
      "connectedKva": 5,
      "connectionNode": "SWB:H:L7"
    },
    {
      "id": "H:M7",
      "address": "M7-S",
      "kind": "repository-house",
      "phase": "A",
      "serviceId": "SVC:H:M7",
      "meterId": "MTR:H:M7",
      "door": {
        "x": -15.5,
        "z": 118.1
      },
      "meterPosition": {
        "x": -14.25,
        "z": 117.6
      },
      "transformerId": "DIST-R7-B2",
      "connectedKva": 5,
      "connectionNode": "SWB:H:M7"
    },
    {
      "id": "H:N7",
      "address": "N7-S",
      "kind": "repository-house",
      "phase": "B",
      "serviceId": "SVC:H:N7",
      "meterId": "MTR:H:N7",
      "door": {
        "x": 14.7,
        "z": 119
      },
      "meterPosition": {
        "x": 15.95,
        "z": 118.5
      },
      "transformerId": "DIST-R7-B3",
      "connectedKva": 5,
      "connectionNode": "SWB:H:N7"
    },
    {
      "id": "H:O7",
      "address": "O7-S",
      "kind": "repository-house",
      "phase": "C",
      "serviceId": "SVC:H:O7",
      "meterId": "MTR:H:O7",
      "door": {
        "x": 41.5,
        "z": 119
      },
      "meterPosition": {
        "x": 42.75,
        "z": 118.5
      },
      "transformerId": "DIST-R7-B3",
      "connectedKva": 5,
      "connectionNode": "SWB:H:O7"
    },
    {
      "id": "H:P7",
      "address": "P7-S",
      "kind": "repository-house",
      "phase": "A",
      "serviceId": "SVC:H:P7",
      "meterId": "MTR:H:P7",
      "door": {
        "x": 61.5,
        "z": 120
      },
      "meterPosition": {
        "x": 62.75,
        "z": 119.5
      },
      "transformerId": "DIST-R7-B3",
      "connectedKva": 5,
      "connectionNode": "SWB:H:P7"
    },
    {
      "id": "H:Q7",
      "address": "Q7-S",
      "kind": "repository-house",
      "phase": "B",
      "serviceId": "SVC:H:Q7",
      "meterId": "MTR:H:Q7",
      "door": {
        "x": 91,
        "z": 121.3
      },
      "meterPosition": {
        "x": 92.25,
        "z": 120.8
      },
      "transformerId": "DIST-R7-B3",
      "connectedKva": 5,
      "connectionNode": "SWB:H:Q7"
    }
  ],
  "nodes": [
    {
      "id": "EXT-GRID",
      "type": "external_supply",
      "position": null,
      "voltageKv": 66,
      "ratedKva": null
    },
    {
      "id": "ZS-66",
      "type": "zone_substation_66kv",
      "position": {
        "x": -143,
        "z": 184.5
      },
      "voltageKv": 66,
      "ratedKva": null
    },
    {
      "id": "ZS-22",
      "type": "zone_substation_22kv",
      "position": {
        "x": -143,
        "z": 184.5
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "MV-ROOT",
      "type": "mv_junction",
      "position": {
        "x": -143,
        "z": 177
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "MV-R8-X-78",
      "type": "mv_junction",
      "position": {
        "x": -78,
        "z": 177
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "MV-R8-X52",
      "type": "mv_junction",
      "position": {
        "x": 52,
        "z": 177
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "MV-R7-X-78",
      "type": "mv_junction",
      "position": {
        "x": -78,
        "z": 131
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "MV-R7-X52",
      "type": "mv_junction",
      "position": {
        "x": 52,
        "z": 131
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "MV-SPUR-R7-B2",
      "type": "mv_tap",
      "position": {
        "x": -78,
        "z": 131
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "DIST-R7-B2",
      "type": "distribution_transformer",
      "position": {
        "x": -78,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": 100
    },
    {
      "id": "LV-BUS-R7-B2",
      "type": "lv_bus",
      "position": {
        "x": -78,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:K7",
      "type": "lv_pillar",
      "position": {
        "x": -65,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:K7",
      "type": "service_meter",
      "position": {
        "x": -63.75,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:K7",
      "type": "switchboard",
      "position": {
        "x": -63.75,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:L7",
      "type": "lv_pillar",
      "position": {
        "x": -39,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:L7",
      "type": "service_meter",
      "position": {
        "x": -37.75,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:L7",
      "type": "switchboard",
      "position": {
        "x": -37.75,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:M7",
      "type": "lv_pillar",
      "position": {
        "x": -13,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:M7",
      "type": "service_meter",
      "position": {
        "x": -14.25,
        "z": 117.6
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:M7",
      "type": "switchboard",
      "position": {
        "x": -14.25,
        "z": 117.6
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MV-SPUR-R7-B3",
      "type": "mv_tap",
      "position": {
        "x": 78,
        "z": 131
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "DIST-R7-B3",
      "type": "distribution_transformer",
      "position": {
        "x": 78,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": 100
    },
    {
      "id": "LV-BUS-R7-B3",
      "type": "lv_bus",
      "position": {
        "x": 78,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:P7",
      "type": "lv_pillar",
      "position": {
        "x": 65,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:P7",
      "type": "service_meter",
      "position": {
        "x": 62.75,
        "z": 119.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:P7",
      "type": "switchboard",
      "position": {
        "x": 62.75,
        "z": 119.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:O7",
      "type": "lv_pillar",
      "position": {
        "x": 39,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:O7",
      "type": "service_meter",
      "position": {
        "x": 42.75,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:O7",
      "type": "switchboard",
      "position": {
        "x": 42.75,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:N7",
      "type": "lv_pillar",
      "position": {
        "x": 13,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:N7",
      "type": "service_meter",
      "position": {
        "x": 15.95,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:N7",
      "type": "switchboard",
      "position": {
        "x": 15.95,
        "z": 118.5
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:H:Q7",
      "type": "lv_pillar",
      "position": {
        "x": 91,
        "z": 124.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:H:Q7",
      "type": "service_meter",
      "position": {
        "x": 92.25,
        "z": 120.8
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:H:Q7",
      "type": "switchboard",
      "position": {
        "x": 92.25,
        "z": 120.8
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MV-SPUR-R8-B2",
      "type": "mv_tap",
      "position": {
        "x": -78,
        "z": 177
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "DIST-R8-B2",
      "type": "distribution_transformer",
      "position": {
        "x": -78,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": 315
    },
    {
      "id": "LV-BUS-R8-B2",
      "type": "lv_bus",
      "position": {
        "x": -78,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:cafe",
      "type": "lv_pillar",
      "position": {
        "x": -91,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:cafe",
      "type": "service_meter",
      "position": {
        "x": -89.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:cafe",
      "type": "switchboard",
      "position": {
        "x": -89.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:bakery",
      "type": "lv_pillar",
      "position": {
        "x": -117,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:bakery",
      "type": "service_meter",
      "position": {
        "x": -115.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:bakery",
      "type": "switchboard",
      "position": {
        "x": -115.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:store",
      "type": "lv_pillar",
      "position": {
        "x": -143,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:store",
      "type": "service_meter",
      "position": {
        "x": -141.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:store",
      "type": "switchboard",
      "position": {
        "x": -141.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:greengrocer",
      "type": "lv_pillar",
      "position": {
        "x": -65,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:greengrocer",
      "type": "service_meter",
      "position": {
        "x": -63.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:greengrocer",
      "type": "switchboard",
      "position": {
        "x": -63.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:butcher",
      "type": "lv_pillar",
      "position": {
        "x": -39,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:butcher",
      "type": "service_meter",
      "position": {
        "x": -37.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:butcher",
      "type": "switchboard",
      "position": {
        "x": -37.75,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "LV-SOUTH-R8-B2",
      "type": "lv_bus",
      "position": {
        "x": -78,
        "z": 183.6
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:hotel",
      "type": "lv_pillar",
      "position": {
        "x": -117,
        "z": 183.6
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:hotel",
      "type": "service_meter",
      "position": {
        "x": -115.75,
        "z": 185
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:hotel",
      "type": "switchboard",
      "position": {
        "x": -115.75,
        "z": 185
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MV-SPUR-R8-B3",
      "type": "mv_tap",
      "position": {
        "x": 78,
        "z": 177
      },
      "voltageKv": 22,
      "ratedKva": null
    },
    {
      "id": "DIST-R8-B3",
      "type": "distribution_transformer",
      "position": {
        "x": 78,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": 315
    },
    {
      "id": "LV-BUS-R8-B3",
      "type": "lv_bus",
      "position": {
        "x": 78,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:school",
      "type": "lv_pillar",
      "position": {
        "x": 65,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:school",
      "type": "service_meter",
      "position": {
        "x": 66.25,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:school",
      "type": "switchboard",
      "position": {
        "x": 66.25,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:post",
      "type": "lv_pillar",
      "position": {
        "x": 39,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:post",
      "type": "service_meter",
      "position": {
        "x": 40.25,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:post",
      "type": "switchboard",
      "position": {
        "x": 40.25,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "TAP:B:pub",
      "type": "lv_pillar",
      "position": {
        "x": 13,
        "z": 170.4
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "MTR:B:pub",
      "type": "service_meter",
      "position": {
        "x": 14.25,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    },
    {
      "id": "SWB:B:pub",
      "type": "switchboard",
      "position": {
        "x": 14.25,
        "z": 168
      },
      "voltageKv": 0.4,
      "ratedKva": null
    }
  ],
  "edges": [
    {
      "id": "MAIN-SWITCH:B:bakery",
      "from": "MTR:B:bakery",
      "to": "SWB:B:bakery",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -115.75,
          "z": 168
        },
        {
          "x": -115.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:bakery",
      "from": "TAP:B:bakery",
      "to": "MTR:B:bakery",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -117,
          "z": 170.4
        },
        {
          "x": -115.75,
          "z": 170.4
        },
        {
          "x": -115.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:bakery",
      "from": "TAP:B:cafe",
      "to": "TAP:B:bakery",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -91,
          "z": 170.4
        },
        {
          "x": -117,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:cafe",
      "from": "LV-BUS-R8-B2",
      "to": "TAP:B:cafe",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 170.4
        },
        {
          "x": -91,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 13,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "TX-LV-R8-B2",
      "from": "DIST-R8-B2",
      "to": "LV-BUS-R8-B2",
      "type": "transformer_secondary",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 170.4
        },
        {
          "x": -78,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": null,
      "ratedKva": 315,
      "ratedMva": null
    },
    {
      "id": "MV-TX-R8-B2",
      "from": "MV-SPUR-R8-B2",
      "to": "DIST-R8-B2",
      "type": "distribution_transformer_primary",
      "voltageKv": 22,
      "route": [
        {
          "x": -78,
          "z": 177
        },
        {
          "x": -78,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 6.6,
      "ampacityA": null,
      "ratedKva": 315,
      "ratedMva": null
    },
    {
      "id": "MV-TAP-R8-B2",
      "from": "MV-R8-X-78",
      "to": "MV-SPUR-R8-B2",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": -78,
          "z": 177
        },
        {
          "x": -78,
          "z": 177
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MV-SPINE-E--78",
      "from": "MV-ROOT",
      "to": "MV-R8-X-78",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": -143,
          "z": 177
        },
        {
          "x": -78,
          "z": 177
        }
      ],
      "lengthGameMetres": 65,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MV-INTAKE",
      "from": "ZS-22",
      "to": "MV-ROOT",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": -143,
          "z": 184.5
        },
        {
          "x": -143,
          "z": 177
        }
      ],
      "lengthGameMetres": 7.5,
      "ampacityA": null,
      "ratedKva": null,
      "ratedMva": 5
    },
    {
      "id": "ZS-TRANSFORM",
      "from": "ZS-66",
      "to": "ZS-22",
      "type": "voltage_conversion",
      "voltageKv": 66,
      "route": [
        {
          "x": -143,
          "z": 184.5
        },
        {
          "x": -143,
          "z": 184.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": null,
      "ratedKva": null,
      "ratedMva": 5
    },
    {
      "id": "GRID-IN",
      "from": "EXT-GRID",
      "to": "ZS-66",
      "type": "external_not_georeferenced",
      "voltageKv": 66,
      "route": [
        {
          "x": -143,
          "z": 184.5
        },
        {
          "x": -143,
          "z": 184.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": null,
      "ratedKva": null,
      "ratedMva": 5
    },
    {
      "id": "MAIN-SWITCH:B:butcher",
      "from": "MTR:B:butcher",
      "to": "SWB:B:butcher",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -37.75,
          "z": 168
        },
        {
          "x": -37.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:butcher",
      "from": "TAP:B:butcher",
      "to": "MTR:B:butcher",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -39,
          "z": 170.4
        },
        {
          "x": -37.75,
          "z": 170.4
        },
        {
          "x": -37.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:butcher",
      "from": "TAP:B:greengrocer",
      "to": "TAP:B:butcher",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -65,
          "z": 170.4
        },
        {
          "x": -39,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:greengrocer",
      "from": "LV-BUS-R8-B2",
      "to": "TAP:B:greengrocer",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 170.4
        },
        {
          "x": -65,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 13,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:cafe",
      "from": "MTR:B:cafe",
      "to": "SWB:B:cafe",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -89.75,
          "z": 168
        },
        {
          "x": -89.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:cafe",
      "from": "TAP:B:cafe",
      "to": "MTR:B:cafe",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -91,
          "z": 170.4
        },
        {
          "x": -89.75,
          "z": 170.4
        },
        {
          "x": -89.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:greengrocer",
      "from": "MTR:B:greengrocer",
      "to": "SWB:B:greengrocer",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -63.75,
          "z": 168
        },
        {
          "x": -63.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:greengrocer",
      "from": "TAP:B:greengrocer",
      "to": "MTR:B:greengrocer",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -65,
          "z": 170.4
        },
        {
          "x": -63.75,
          "z": 170.4
        },
        {
          "x": -63.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:hotel",
      "from": "MTR:B:hotel",
      "to": "SWB:B:hotel",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -115.75,
          "z": 185
        },
        {
          "x": -115.75,
          "z": 185
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:hotel",
      "from": "TAP:B:hotel",
      "to": "MTR:B:hotel",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -117,
          "z": 183.6
        },
        {
          "x": -115.75,
          "z": 183.6
        },
        {
          "x": -115.75,
          "z": 185
        }
      ],
      "lengthGameMetres": 2.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:hotel",
      "from": "LV-SOUTH-R8-B2",
      "to": "TAP:B:hotel",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 183.6
        },
        {
          "x": -117,
          "z": 183.6
        }
      ],
      "lengthGameMetres": 39,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-DUCT-R8-B2",
      "from": "LV-BUS-R8-B2",
      "to": "LV-SOUTH-R8-B2",
      "type": "lv_road_crossing",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 170.4
        },
        {
          "x": -78,
          "z": 183.6
        }
      ],
      "lengthGameMetres": 13.2,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:post",
      "from": "MTR:B:post",
      "to": "SWB:B:post",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 40.25,
          "z": 168
        },
        {
          "x": 40.25,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:post",
      "from": "TAP:B:post",
      "to": "MTR:B:post",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 39,
          "z": 170.4
        },
        {
          "x": 40.25,
          "z": 170.4
        },
        {
          "x": 40.25,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:post",
      "from": "TAP:B:school",
      "to": "TAP:B:post",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 65,
          "z": 170.4
        },
        {
          "x": 39,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:school",
      "from": "LV-BUS-R8-B3",
      "to": "TAP:B:school",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 78,
          "z": 170.4
        },
        {
          "x": 65,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 13,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "TX-LV-R8-B3",
      "from": "DIST-R8-B3",
      "to": "LV-BUS-R8-B3",
      "type": "transformer_secondary",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 78,
          "z": 170.4
        },
        {
          "x": 78,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": null,
      "ratedKva": 315,
      "ratedMva": null
    },
    {
      "id": "MV-TX-R8-B3",
      "from": "MV-SPUR-R8-B3",
      "to": "DIST-R8-B3",
      "type": "distribution_transformer_primary",
      "voltageKv": 22,
      "route": [
        {
          "x": 78,
          "z": 177
        },
        {
          "x": 78,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 6.6,
      "ampacityA": null,
      "ratedKva": 315,
      "ratedMva": null
    },
    {
      "id": "MV-TAP-R8-B3",
      "from": "MV-R8-X52",
      "to": "MV-SPUR-R8-B3",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": 52,
          "z": 177
        },
        {
          "x": 78,
          "z": 177
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MV-SPINE-E-52",
      "from": "MV-R8-X-78",
      "to": "MV-R8-X52",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": -78,
          "z": 177
        },
        {
          "x": 52,
          "z": 177
        }
      ],
      "lengthGameMetres": 130,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:pub",
      "from": "MTR:B:pub",
      "to": "SWB:B:pub",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 14.25,
          "z": 168
        },
        {
          "x": 14.25,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:pub",
      "from": "TAP:B:pub",
      "to": "MTR:B:pub",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 13,
          "z": 170.4
        },
        {
          "x": 14.25,
          "z": 170.4
        },
        {
          "x": 14.25,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:pub",
      "from": "TAP:B:post",
      "to": "TAP:B:pub",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 39,
          "z": 170.4
        },
        {
          "x": 13,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:school",
      "from": "MTR:B:school",
      "to": "SWB:B:school",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 66.25,
          "z": 168
        },
        {
          "x": 66.25,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:school",
      "from": "TAP:B:school",
      "to": "MTR:B:school",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 65,
          "z": 170.4
        },
        {
          "x": 66.25,
          "z": 170.4
        },
        {
          "x": 66.25,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:B:store",
      "from": "MTR:B:store",
      "to": "SWB:B:store",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -141.75,
          "z": 168
        },
        {
          "x": -141.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:B:store",
      "from": "TAP:B:store",
      "to": "MTR:B:store",
      "type": "underground_service",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -143,
          "z": 170.4
        },
        {
          "x": -141.75,
          "z": 170.4
        },
        {
          "x": -141.75,
          "z": 168
        }
      ],
      "lengthGameMetres": 3.65,
      "ampacityA": 250,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:B:store",
      "from": "TAP:B:bakery",
      "to": "TAP:B:store",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -117,
          "z": 170.4
        },
        {
          "x": -143,
          "z": 170.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:K7",
      "from": "MTR:H:K7",
      "to": "SWB:H:K7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -63.75,
          "z": 118.5
        },
        {
          "x": -63.75,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:K7",
      "from": "TAP:H:K7",
      "to": "MTR:H:K7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -65,
          "z": 124.4
        },
        {
          "x": -63.75,
          "z": 124.4
        },
        {
          "x": -63.75,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 7.15,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:K7",
      "from": "LV-BUS-R7-B2",
      "to": "TAP:H:K7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 124.4
        },
        {
          "x": -65,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 13,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "TX-LV-R7-B2",
      "from": "DIST-R7-B2",
      "to": "LV-BUS-R7-B2",
      "type": "transformer_secondary",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -78,
          "z": 124.4
        },
        {
          "x": -78,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": null,
      "ratedKva": 100,
      "ratedMva": null
    },
    {
      "id": "MV-TX-R7-B2",
      "from": "MV-SPUR-R7-B2",
      "to": "DIST-R7-B2",
      "type": "distribution_transformer_primary",
      "voltageKv": 22,
      "route": [
        {
          "x": -78,
          "z": 131
        },
        {
          "x": -78,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 6.6,
      "ampacityA": null,
      "ratedKva": 100,
      "ratedMva": null
    },
    {
      "id": "MV-TAP-R7-B2",
      "from": "MV-R7-X-78",
      "to": "MV-SPUR-R7-B2",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": -78,
          "z": 131
        },
        {
          "x": -78,
          "z": 131
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MV-AV-X-78-R7",
      "from": "MV-R8-X-78",
      "to": "MV-R7-X-78",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": -78,
          "z": 177
        },
        {
          "x": -78,
          "z": 131
        }
      ],
      "lengthGameMetres": 46,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:L7",
      "from": "MTR:H:L7",
      "to": "SWB:H:L7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -37.75,
          "z": 118.5
        },
        {
          "x": -37.75,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:L7",
      "from": "TAP:H:L7",
      "to": "MTR:H:L7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -39,
          "z": 124.4
        },
        {
          "x": -37.75,
          "z": 124.4
        },
        {
          "x": -37.75,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 7.15,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:L7",
      "from": "TAP:H:K7",
      "to": "TAP:H:L7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -65,
          "z": 124.4
        },
        {
          "x": -39,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:M7",
      "from": "MTR:H:M7",
      "to": "SWB:H:M7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -14.25,
          "z": 117.6
        },
        {
          "x": -14.25,
          "z": 117.6
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:M7",
      "from": "TAP:H:M7",
      "to": "MTR:H:M7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -13,
          "z": 124.4
        },
        {
          "x": -14.25,
          "z": 124.4
        },
        {
          "x": -14.25,
          "z": 117.6
        }
      ],
      "lengthGameMetres": 8.05,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:M7",
      "from": "TAP:H:L7",
      "to": "TAP:H:M7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": -39,
          "z": 124.4
        },
        {
          "x": -13,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:N7",
      "from": "MTR:H:N7",
      "to": "SWB:H:N7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 15.95,
          "z": 118.5
        },
        {
          "x": 15.95,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:N7",
      "from": "TAP:H:N7",
      "to": "MTR:H:N7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 13,
          "z": 124.4
        },
        {
          "x": 15.95,
          "z": 124.4
        },
        {
          "x": 15.95,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 8.85,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:N7",
      "from": "TAP:H:O7",
      "to": "TAP:H:N7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 39,
          "z": 124.4
        },
        {
          "x": 13,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:O7",
      "from": "TAP:H:P7",
      "to": "TAP:H:O7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 65,
          "z": 124.4
        },
        {
          "x": 39,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:P7",
      "from": "LV-BUS-R7-B3",
      "to": "TAP:H:P7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 78,
          "z": 124.4
        },
        {
          "x": 65,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 13,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "TX-LV-R7-B3",
      "from": "DIST-R7-B3",
      "to": "LV-BUS-R7-B3",
      "type": "transformer_secondary",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 78,
          "z": 124.4
        },
        {
          "x": 78,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": null,
      "ratedKva": 100,
      "ratedMva": null
    },
    {
      "id": "MV-TX-R7-B3",
      "from": "MV-SPUR-R7-B3",
      "to": "DIST-R7-B3",
      "type": "distribution_transformer_primary",
      "voltageKv": 22,
      "route": [
        {
          "x": 78,
          "z": 131
        },
        {
          "x": 78,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 6.6,
      "ampacityA": null,
      "ratedKva": 100,
      "ratedMva": null
    },
    {
      "id": "MV-TAP-R7-B3",
      "from": "MV-R7-X52",
      "to": "MV-SPUR-R7-B3",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": 52,
          "z": 131
        },
        {
          "x": 78,
          "z": 131
        }
      ],
      "lengthGameMetres": 26,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MV-AV-X52-R7",
      "from": "MV-R8-X52",
      "to": "MV-R7-X52",
      "type": "mv_underground",
      "voltageKv": 22,
      "route": [
        {
          "x": 52,
          "z": 177
        },
        {
          "x": 52,
          "z": 131
        }
      ],
      "lengthGameMetres": 46,
      "ampacityA": 160,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:O7",
      "from": "MTR:H:O7",
      "to": "SWB:H:O7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 42.75,
          "z": 118.5
        },
        {
          "x": 42.75,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:O7",
      "from": "TAP:H:O7",
      "to": "MTR:H:O7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 39,
          "z": 124.4
        },
        {
          "x": 42.75,
          "z": 124.4
        },
        {
          "x": 42.75,
          "z": 118.5
        }
      ],
      "lengthGameMetres": 9.65,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:P7",
      "from": "MTR:H:P7",
      "to": "SWB:H:P7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 62.75,
          "z": 119.5
        },
        {
          "x": 62.75,
          "z": 119.5
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:P7",
      "from": "TAP:H:P7",
      "to": "MTR:H:P7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 65,
          "z": 124.4
        },
        {
          "x": 62.75,
          "z": 124.4
        },
        {
          "x": 62.75,
          "z": 119.5
        }
      ],
      "lengthGameMetres": 7.15,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "MAIN-SWITCH:H:Q7",
      "from": "MTR:H:Q7",
      "to": "SWB:H:Q7",
      "type": "service_switchboard",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 92.25,
          "z": 120.8
        },
        {
          "x": 92.25,
          "z": 120.8
        }
      ],
      "lengthGameMetres": 0,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "SERVICE:H:Q7",
      "from": "TAP:H:Q7",
      "to": "MTR:H:Q7",
      "type": "service_drop",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 91,
          "z": 124.4
        },
        {
          "x": 92.25,
          "z": 124.4
        },
        {
          "x": 92.25,
          "z": 120.8
        }
      ],
      "lengthGameMetres": 4.85,
      "ampacityA": 80,
      "ratedKva": null,
      "ratedMva": null
    },
    {
      "id": "LV-MAIN:H:Q7",
      "from": "LV-BUS-R7-B3",
      "to": "TAP:H:Q7",
      "type": "lv_main",
      "voltageKv": 0.4,
      "route": [
        {
          "x": 78,
          "z": 124.4
        },
        {
          "x": 91,
          "z": 124.4
        }
      ],
      "lengthGameMetres": 13,
      "ampacityA": 400,
      "ratedKva": null,
      "ratedMva": null
    }
  ],
  "transformers": [
    {
      "id": "DIST-R7-B2",
      "ratedKva": 100,
      "customers": [
        "H:K7",
        "H:L7",
        "H:M7"
      ],
      "position": {
        "x": -78,
        "z": 124.4
      }
    },
    {
      "id": "DIST-R7-B3",
      "ratedKva": 100,
      "customers": [
        "H:N7",
        "H:O7",
        "H:P7",
        "H:Q7"
      ],
      "position": {
        "x": 78,
        "z": 124.4
      }
    },
    {
      "id": "DIST-R8-B2",
      "ratedKva": 315,
      "customers": [
        "B:bakery",
        "B:butcher",
        "B:cafe",
        "B:greengrocer",
        "B:hotel",
        "B:store"
      ],
      "position": {
        "x": -78,
        "z": 170.4
      }
    },
    {
      "id": "DIST-R8-B3",
      "ratedKva": 315,
      "customers": [
        "B:post",
        "B:pub",
        "B:school"
      ],
      "position": {
        "x": 78,
        "z": 170.4
      }
    }
  ]
});
