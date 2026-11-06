/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/crewpot.json`.
 */
export type Crewpot = {
  "address": "CV7eUQCnNZ9wYereuWFMG98sTDNp5k4QsSPF5rzqUgba",
  "metadata": {
    "name": "crewpot",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Fixed-membership contribution vaults with collective payout approval"
  },
  "instructions": [
    {
      "name": "approvePayout",
      "discriminator": [
        188,
        233,
        111,
        145,
        229,
        102,
        28,
        145
      ],
      "accounts": [
        {
          "name": "member",
          "signer": true
        },
        {
          "name": "pot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot.creator",
                "account": "potAccount"
              },
              {
                "kind": "account",
                "path": "pot.potId",
                "account": "potAccount"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "claimRefund",
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "member",
          "signer": true
        },
        {
          "name": "pot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot.creator",
                "account": "potAccount"
              },
              {
                "kind": "account",
                "path": "pot.potId",
                "account": "potAccount"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "pot"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pot"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "contribute",
      "discriminator": [
        82,
        33,
        68,
        131,
        32,
        0,
        205,
        95
      ],
      "accounts": [
        {
          "name": "member",
          "signer": true
        },
        {
          "name": "pot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot.creator",
                "account": "potAccount"
              },
              {
                "kind": "account",
                "path": "pot.potId",
                "account": "potAccount"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "pot"
          ]
        },
        {
          "name": "source",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pot"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createPot",
      "discriminator": [
        232,
        45,
        123,
        181,
        204,
        121,
        131,
        9
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "pot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "args.potId"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pot"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createPotArgs"
            }
          }
        }
      ]
    },
    {
      "name": "releaseFunds",
      "discriminator": [
        225,
        88,
        91,
        108,
        126,
        52,
        2,
        26
      ],
      "accounts": [
        {
          "name": "pot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot.creator",
                "account": "potAccount"
              },
              {
                "kind": "account",
                "path": "pot.potId",
                "account": "potAccount"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "pot"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pot"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "potAccount",
      "discriminator": [
        202,
        25,
        205,
        47,
        59,
        253,
        100,
        118
      ]
    }
  ],
  "events": [
    {
      "name": "contributionMade",
      "discriminator": [
        81,
        218,
        72,
        109,
        93,
        96,
        131,
        199
      ]
    },
    {
      "name": "fundsReleased",
      "discriminator": [
        178,
        119,
        252,
        230,
        131,
        104,
        210,
        210
      ]
    },
    {
      "name": "payoutApproved",
      "discriminator": [
        97,
        167,
        51,
        171,
        134,
        171,
        110,
        198
      ]
    },
    {
      "name": "payoutAuthorized",
      "discriminator": [
        30,
        11,
        11,
        196,
        134,
        173,
        250,
        253
      ]
    },
    {
      "name": "potCreated",
      "discriminator": [
        123,
        24,
        71,
        133,
        138,
        137,
        140,
        204
      ]
    },
    {
      "name": "potFullyFunded",
      "discriminator": [
        191,
        69,
        95,
        147,
        25,
        125,
        36,
        104
      ]
    },
    {
      "name": "refundClaimed",
      "discriminator": [
        136,
        64,
        242,
        99,
        4,
        244,
        208,
        130
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidMembers",
      "msg": "Choose between two and six valid members."
    },
    {
      "code": 6001,
      "name": "creatorMissing",
      "msg": "The creator must be a member."
    },
    {
      "code": 6002,
      "name": "duplicateMember",
      "msg": "Each member wallet must be unique."
    },
    {
      "code": 6003,
      "name": "invalidRecipient",
      "msg": "Choose a valid recipient wallet."
    },
    {
      "code": 6004,
      "name": "invalidAmount",
      "msg": "The contribution must be positive."
    },
    {
      "code": 6005,
      "name": "invalidThreshold",
      "msg": "Approvals must require a strict majority of members."
    },
    {
      "code": 6006,
      "name": "invalidDeadline",
      "msg": "Choose a future deadline."
    },
    {
      "code": 6007,
      "name": "invalidMetadata",
      "msg": "Use a title of 1–64 bytes and a description of at most 280 bytes."
    },
    {
      "code": 6008,
      "name": "unsupportedMint",
      "msg": "Use a six-decimal SPL token with no freeze authority."
    },
    {
      "code": 6009,
      "name": "overflow",
      "msg": "The amount is too large."
    },
    {
      "code": 6010,
      "name": "notMember",
      "msg": "This wallet is not a member of the pot."
    },
    {
      "code": 6011,
      "name": "alreadyContributed",
      "msg": "This member has already contributed."
    },
    {
      "code": 6012,
      "name": "expired",
      "msg": "The deadline has passed."
    },
    {
      "code": 6013,
      "name": "alreadyAuthorized",
      "msg": "Payout is already authorized; refunds are unavailable."
    },
    {
      "code": 6014,
      "name": "alreadyReleased",
      "msg": "This pot has already paid out."
    },
    {
      "code": 6015,
      "name": "notContributed",
      "msg": "Contribute before approving or claiming a refund."
    },
    {
      "code": 6016,
      "name": "notFullyFunded",
      "msg": "All members must contribute before voting opens."
    },
    {
      "code": 6017,
      "name": "alreadyApproved",
      "msg": "This member has already approved."
    },
    {
      "code": 6018,
      "name": "notAuthorized",
      "msg": "The pot needs full funding and majority approval."
    },
    {
      "code": 6019,
      "name": "refundNotAvailable",
      "msg": "Refunds become available at the deadline."
    },
    {
      "code": 6020,
      "name": "alreadyRefunded",
      "msg": "This member has already claimed their refund."
    }
  ],
  "types": [
    {
      "name": "contributionMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "createPotArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "potId",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "contributionAmount",
            "type": "u64"
          },
          {
            "name": "members",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "approvalThreshold",
            "type": "u8"
          },
          {
            "name": "deadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "fundsReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "memberEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "contributed",
            "type": "bool"
          },
          {
            "name": "approved",
            "type": "bool"
          },
          {
            "name": "refunded",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "payoutApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "approvals",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "payoutAuthorized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "potAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "potId",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "contributionAmount",
            "type": "u64"
          },
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "totalContributed",
            "docs": [
              "Historical deposits; never use raw vault balance to count funding."
            ],
            "type": "u64"
          },
          {
            "name": "totalRefunded",
            "type": "u64"
          },
          {
            "name": "fundedCount",
            "type": "u8"
          },
          {
            "name": "approvalThreshold",
            "type": "u8"
          },
          {
            "name": "approvalCount",
            "type": "u8"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "payoutAuthorized",
            "type": "bool"
          },
          {
            "name": "released",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "members",
            "type": {
              "vec": {
                "defined": {
                  "name": "memberEntry"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "potCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "potFullyFunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "refundClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
