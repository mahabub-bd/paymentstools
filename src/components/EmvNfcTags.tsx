import { useState, useMemo } from 'react';

interface EmvTag {
  tag: string;
  name: string;
  description: string;
  source: string;
  format: string;
  length: string;
  type: 'primitive' | 'constructed';
}

const EMV_TAGS: EmvTag[] = [
  // Basic EMV Tags
  { tag: '4F', name: 'Application Identifier (ADF Name)', description: 'Identifies the application. The AID is made up of the Registered Application Provider Identifier (RID) and the Proprietary Identifier Extension (PIX).', source: 'Card', format: 'binary', length: '5-16 bytes', type: 'primitive' },
  { tag: '50', name: 'Application Label', description: 'Mnemonic associated with the AID according to ISO/IEC 7816-5. Used in application selection.', source: 'Card', format: 'ans', length: '1-16 bytes', type: 'primitive' },
  { tag: '57', name: 'Track 2 Equivalent Data', description: 'Contains the data elements of track 2 according to ISO/IEC 7813, excluding start sentinel, end sentinel, and LRC.', source: 'Card', format: 'binary', length: '0-19 bytes', type: 'primitive' },
  { tag: '5A', name: 'Application Primary Account Number (PAN)', description: 'Valid cardholder account number.', source: 'Card', format: 'cn', length: 'up to 10 bytes', type: 'primitive' },
  { tag: '5F20', name: 'Cardholder Name', description: 'Indicates cardholder name according to ISO 7813.', source: 'Card', format: 'ans', length: '2-26 bytes', type: 'primitive' },
  { tag: '5F24', name: 'Application Expiration Date', description: 'Date after which application expires. The date is expressed in the YYMMDD format.', source: 'Card', format: 'n', length: '3 bytes (YYMMDD)', type: 'primitive' },
  { tag: '5F25', name: 'Application Effective Date', description: 'Date from which the application may be used. Expressed in YYMMDD format.', source: 'Card', format: 'n', length: '3 bytes (YYMMDD)', type: 'primitive' },
  { tag: '5F28', name: 'Issuer Country Code', description: 'Indicates the country of the issuer according to ISO 3166-1.', source: 'Card', format: 'n', length: '2 bytes', type: 'primitive' },
  { tag: '5F2A', name: 'Transaction Currency Code', description: 'Indicates the currency code of the transaction according to ISO 4217.', source: 'Terminal', format: 'n', length: '2 bytes', type: 'primitive' },
  { tag: '5F2D', name: 'Language Preference', description: '1-4 languages stored in order of preference, each represented by 2 alphabetical characters according to ISO 639.', source: 'Card', format: 'an', length: '2-8 bytes', type: 'primitive' },
  { tag: '5F30', name: 'Service Code', description: 'Service code as defined in ISO/IEC 7813 for Track 1 and Track 2.', source: 'Card', format: 'n', length: '2 bytes', type: 'primitive' },
  { tag: '5F34', name: 'PAN Sequence Number (PSN)', description: 'Identifies and differentiates cards with the same PAN.', source: 'Card', format: 'n', length: '1 byte', type: 'primitive' },
  { tag: '5F36', name: 'Transaction Currency Exponent', description: 'Identifies the decimal point position from the right of the transaction amount according to ISO 4217.', source: 'Terminal', format: 'n', length: '1 byte', type: 'primitive' },

  // Template Tags
  { tag: '61', name: 'Application Template', description: 'Template containing one or more data objects relevant to an application directory entry.', source: 'Card', format: 'binary', length: 'up to 252 bytes', type: 'constructed' },
  { tag: '6F', name: 'File Control Information (FCI) Template', description: 'Identifies the FCI template according to ISO/IEC 7816-4.', source: 'Card', format: 'binary', length: '0-252 bytes', type: 'constructed' },
  { tag: '70', name: 'READ RECORD Response Message Template', description: 'Template containing the data objects returned by the Card in response to a READ RECORD command.', source: 'Card', format: 'binary', length: '0-255 bytes', type: 'constructed' },
  { tag: '77', name: 'Response Message Template Format 2', description: 'Contains the data objects (with tags and lengths) returned by the card in response to a command.', source: 'Card', format: 'binary', length: 'variable', type: 'constructed' },
  { tag: '80', name: 'Response Message Template Format 1', description: 'Contains the data objects (without tags and lengths) returned by the card in response to a command.', source: 'Card', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: 'A5', name: 'FCI Proprietary Template', description: 'Identifies the data object proprietary to this specification in the FCI template.', source: 'Card', format: 'binary', length: 'variable', type: 'constructed' },

  // EMV Data Objects
  { tag: '81', name: 'Amount, Authorised (Binary)', description: 'Authorised amount of the transaction (excluding adjustments).', source: 'Terminal', format: 'binary', length: '4 bytes', type: 'primitive' },
  { tag: '82', name: 'Application Interchange Profile (AIP)', description: 'Indicates the capabilities of the card to support specific functions in the application.', source: 'Card', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '83', name: 'Command Template', description: 'Identifies the data field of a command message.', source: 'Terminal', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '84', name: 'Dedicated File (DF) Name', description: 'Identifies the name of the DF as described in ISO/IEC 7816-4.', source: 'Card', format: 'binary', length: '5-16 bytes', type: 'primitive' },
  { tag: '86', name: 'Issuer Script Command', description: 'Contains a command for transmission to the ICC.', source: 'Issuer', format: 'binary', length: 'up to 125 bytes', type: 'primitive' },
  { tag: '87', name: 'Application Priority Indicator', description: 'Indicates the priority of a given application or group of applications in a directory.', source: 'Card', format: 'binary', length: '1 byte', type: 'primitive' },
  { tag: '88', name: 'Short File Identifier (SFI)', description: 'Identifies the AEF referenced in commands related to a given ADF or DDF.', source: 'Card', format: 'binary', length: '1 byte', type: 'primitive' },
  { tag: '89', name: 'Authorization Code', description: 'Non-zero value generated by the issuer for an approved transaction.', source: 'Issuer', format: 'an', length: '6 bytes', type: 'primitive' },
  { tag: '8A', name: 'Authorization Response Code (ARC)', description: 'Indicates the transaction disposition of the transaction received from the issuer.', source: 'Issuer', format: 'an', length: '2 bytes', type: 'primitive' },
  { tag: '8C', name: 'Card Risk Management Data Object List 1 (CDOL1)', description: 'List of data objects to be passed to the ICC in the first GENERATE AC command.', source: 'Card', format: 'binary', length: 'up to 252 bytes', type: 'primitive' },
  { tag: '8D', name: 'Card Risk Management Data Object List 2 (CDOL2)', description: 'List of data objects to be passed to the ICC in the second GENERATE AC command.', source: 'Card', format: 'binary', length: 'up to 252 bytes', type: 'primitive' },
  { tag: '8E', name: 'Cardholder Verification Method (CVM) List', description: 'Identifies a prioritised list of methods of verification of the cardholder supported by the card application.', source: 'Card', format: 'binary', length: 'up to 252 bytes', type: 'primitive' },
  { tag: '8F', name: 'Certification Authority Public Key Index (PKI)', description: 'Identifies the certification authority\'s public key in conjunction with the RID.', source: 'Card', format: 'binary', length: '1 byte', type: 'primitive' },
  { tag: '90', name: 'Issuer Public Key Certificate', description: 'Issuer\'s public key certified by a certification authority for use in offline data authentication.', source: 'Card', format: 'binary', length: '64-248 bytes', type: 'primitive' },
  { tag: '91', name: 'Issuer Authentication Data', description: 'Issuer data transmitted to card for online Issuer authentication.', source: 'Issuer', format: 'binary', length: '8-16 bytes', type: 'primitive' },
  { tag: '92', name: 'Issuer Public Key Remainder', description: 'Portion of the Issuer Public Key Modulus which does not fit into the Issuer PK Certificate.', source: 'Card', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '93', name: 'Signed Static Application Data (SAD)', description: 'Digital signature on critical application parameters that is used in static data authentication.', source: 'Card', format: 'binary', length: '64-248 bytes', type: 'primitive' },
  { tag: '94', name: 'Application File Locator (AFL)', description: 'Indicates the location (SFI, range of records) of the AEFs related to a given application.', source: 'Card', format: 'binary', length: '4-252 bytes', type: 'primitive' },
  { tag: '95', name: 'Terminal Verification Results (TVR)', description: 'Status of the different functions as seen from the terminal.', source: 'Terminal', format: 'binary', length: '5 bytes', type: 'primitive' },
  { tag: '97', name: 'Transaction Certificate Data Object List (TDOL)', description: 'List of data objects to be used by the terminal in generating the TC Hash Value.', source: 'Card', format: 'binary', length: 'up to 252 bytes', type: 'primitive' },
  { tag: '98', name: 'Transaction Certificate (TC) Hash Value', description: 'Result of a hash function specified in Book 2, Annex B3.1.', source: 'Terminal', format: 'binary', length: '20 bytes', type: 'primitive' },
  { tag: '99', name: 'Transaction PIN Data', description: 'Data entered by the cardholder for the purpose of the PIN verification.', source: 'Terminal', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '9A', name: 'Transaction Date', description: 'Local date that the transaction was authorised.', source: 'Terminal', format: 'n', length: '3 bytes (YYMMDD)', type: 'primitive' },
  { tag: '9B', name: 'Transaction Status Information (TSI)', description: 'Indicates the functions performed in a transaction.', source: 'Terminal', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9C', name: 'Transaction Type', description: 'Indicates the type of financial transaction, represented by the first two digits of the ISO 8583 Processing Code.', source: 'Terminal', format: 'n', length: '1 byte', type: 'primitive' },
  { tag: '9D', name: 'Directory Definition File (DDF) Name', description: 'Identifies the name of a DF associated with a directory.', source: 'Card', format: 'binary', length: '5-16 bytes', type: 'primitive' },

  // 9Fxx Tags
  { tag: '9F01', name: 'Acquirer Identifier', description: 'Uniquely identifies the acquirer within each payment system.', source: 'Terminal', format: 'n', length: '6-11 bytes', type: 'primitive' },
  { tag: '9F02', name: 'Amount, Authorised (Numeric)', description: 'Authorised amount of the transaction (excluding adjustments).', source: 'Terminal', format: 'n', length: '6 bytes', type: 'primitive' },
  { tag: '9F03', name: 'Amount, Other (Numeric)', description: 'Secondary amount associated with the transaction representing a cashback amount.', source: 'Terminal', format: 'n', length: '6 bytes', type: 'primitive' },
  { tag: '9F04', name: 'Amount, Other (Binary)', description: 'Secondary amount associated with the transaction representing a cashback amount.', source: 'Terminal', format: 'binary', length: '4 bytes', type: 'primitive' },
  { tag: '9F05', name: 'Application Discretionary Data', description: 'Issuer or payment system specified data relating to the application.', source: 'Card', format: 'binary', length: '1-32 bytes', type: 'primitive' },
  { tag: '9F06', name: 'Application Identifier (AID), Terminal', description: 'Identifies the application as described in ISO/IEC 7816-5.', source: 'Terminal', format: 'binary', length: '5-16 bytes', type: 'primitive' },
  { tag: '9F07', name: 'Application Usage Control (AUC)', description: 'Indicates issuer\'s specified restrictions on the geographic usage and services allowed.', source: 'Card', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9F08', name: 'Application Version Number, Card', description: 'Version number assigned by the payment system for the application in the Card.', source: 'Card', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9F09', name: 'Application Version Number, Terminal', description: 'Version number assigned by the payment system for the Kernel application.', source: 'Terminal', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9F0D', name: 'Issuer Action Code - Default', description: 'Specifies the issuer\'s conditions that cause a transaction to be rejected if it might have been approved online.', source: 'Card', format: 'binary', length: '5 bytes', type: 'primitive' },
  { tag: '9F0E', name: 'Issuer Action Code - Denial', description: 'Specifies the issuer\'s conditions that cause the denial of a transaction without attempt to go online.', source: 'Card', format: 'binary', length: '5 bytes', type: 'primitive' },
  { tag: '9F0F', name: 'Issuer Action Code - Online', description: 'Specifies the issuer\'s conditions that cause a transaction to be transmitted online.', source: 'Card', format: 'binary', length: '5 bytes', type: 'primitive' },
  { tag: '9F10', name: 'Issuer Application Data (IAD)', description: 'Contains proprietary application data for transmission to the issuer in an online transaction.', source: 'Card', format: 'binary', length: '0-32 bytes', type: 'primitive' },
  { tag: '9F11', name: 'Issuer Code Table Index', description: 'Indicates the code table according to ISO/IEC 8859 for displaying the Application Preferred Name.', source: 'Card', format: 'n', length: '1 byte', type: 'primitive' },
  { tag: '9F12', name: 'Application Preferred Name', description: 'Preferred mnemonic associated with the AID.', source: 'Card', format: 'ans', length: '1-16 bytes', type: 'primitive' },
  { tag: '9F13', name: 'Last Online ATC Register', description: 'ATC value of the last transaction that went online.', source: 'Card', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9F14', name: 'Lower Consecutive Offline Limit (LCOL)', description: 'Issuer-specified preference for the maximum number of consecutive offline transactions.', source: 'Card', format: 'binary', length: '1 byte', type: 'primitive' },
  { tag: '9F15', name: 'Merchant Category Code (MCC)', description: 'Classifies the type of business being done by the merchant.', source: 'Terminal', format: 'n', length: '2 bytes', type: 'primitive' },
  { tag: '9F16', name: 'Merchant Identifier', description: 'When concatenated with the Acquirer Identifier, uniquely identifies a given merchant.', source: 'Terminal', format: 'ans', length: '15 bytes', type: 'primitive' },
  { tag: '9F17', name: 'PIN Try Counter', description: 'Number of PIN tries remaining.', source: 'Card', format: 'binary', length: '1 byte', type: 'primitive' },
  { tag: '9F18', name: 'Issuer Script Identifier', description: 'May be sent in authorisation response from issuer when response contains Issuer Script.', source: 'Issuer', format: 'binary', length: '4 bytes', type: 'primitive' },
  { tag: '9F1A', name: 'Terminal Country Code', description: 'Indicates the country of the terminal, represented according to ISO 3166.', source: 'Terminal', format: 'n', length: '2 bytes', type: 'primitive' },
  { tag: '9F1B', name: 'Terminal Floor Limit', description: 'Indicates the floor limit in the terminal in conjunction with the AID.', source: 'Terminal', format: 'binary', length: '4 bytes', type: 'primitive' },
  { tag: '9F1C', name: 'Terminal Identification', description: 'Designates the unique location of a Terminal at a merchant.', source: 'Terminal', format: 'an', length: '8 bytes', type: 'primitive' },
  { tag: '9F1E', name: 'Interface Device (IFD) Serial Number', description: 'Unique and permanent serial number assigned to the IFD by the manufacturer.', source: 'Terminal', format: 'an', length: '8 bytes', type: 'primitive' },
  { tag: '9F1F', name: 'Track 1 Discretionary Data', description: 'Discretionary part of track 1 according to ISO/IEC 7813.', source: 'Card', format: 'ans', length: 'variable', type: 'primitive' },
  { tag: '9F20', name: 'Track 2 Discretionary Data', description: 'Discretionary part of track 2 according to ISO/IEC 7813.', source: 'Card', format: 'cn', length: 'variable', type: 'constructed' },
  { tag: '9F21', name: 'Transaction Time', description: 'Local time at which the transaction was performed.', source: 'Terminal', format: 'n', length: '3 bytes (HHMMSS)', type: 'constructed' },
  { tag: '9F22', name: 'Certification Authority Public Key Index, Terminal', description: 'Identifies the CA\'s public key for use in offline static and dynamic data authentication.', source: 'Terminal', format: 'binary', length: '1 byte', type: 'constructed' },
  { tag: '9F26', name: 'Application Cryptogram (AC)', description: 'Cryptogram returned by the card in response of the GENERATE AC command.', source: 'Card', format: 'binary', length: '8 bytes', type: 'constructed' },
  { tag: '9F27', name: 'Cryptogram Information Data (CID)', description: 'Indicates the type of cryptogram and the actions to be performed by the terminal.', source: 'Card', format: 'binary', length: '1 byte', type: 'constructed' },
  { tag: '9F32', name: 'Issuer Public Key Exponent', description: 'Issuer public key exponent used for verification of Signed Static Application Data.', source: 'Card', format: 'binary', length: '1-3 bytes', type: 'constructed' },
  { tag: '9F33', name: 'Terminal Capabilities', description: 'Indicates the card data input, CVM, and security capabilities of the Terminal.', source: 'Terminal', format: 'binary', length: '3 bytes', type: 'constructed' },
  { tag: '9F34', name: 'Cardholder Verification Method (CVM) Results', description: 'Indicates the results of the last CVM performed.', source: 'Terminal', format: 'binary', length: '3 bytes', type: 'constructed' },
  { tag: '9F35', name: 'Terminal Type', description: 'Indicates the environment of the terminal, its communications capability, and its operational control.', source: 'Terminal', format: 'n', length: '1 byte', type: 'constructed' },
  { tag: '9F36', name: 'Application Transaction Counter (ATC)', description: 'Count of the number of transactions initiated since personalisation.', source: 'Card', format: 'binary', length: '2 bytes', type: 'constructed' },
  { tag: '9F37', name: 'Unpredictable Number (UN)', description: 'Value to provide variability and uniqueness to the generation of a cryptogram.', source: 'Terminal', format: 'binary', length: '4 bytes', type: 'constructed' },
  { tag: '9F38', name: 'Processing Options Data Object List (PDOL)', description: 'List of terminal data objects requested by the card to be transmitted in GET PROCESSING OPTIONS.', source: 'Card', format: 'binary', length: 'variable', type: 'constructed' },
  { tag: '9F39', name: 'POS Entry Mode', description: 'Indicates the method by which the PAN was entered, according to ISO 8583.', source: 'Terminal', format: 'n', length: '1 byte', type: 'constructed' },
  { tag: '9F3A', name: 'Amount, Reference Currency (Binary)', description: 'Authorised amount expressed in the reference currency.', source: 'Terminal', format: 'binary', length: '4 bytes', type: 'constructed' },
  { tag: '9F3C', name: 'Currency Code, Transaction Reference', description: 'Code defining the common currency used by the terminal.', source: 'Terminal', format: 'n', length: '2 bytes', type: 'constructed' },
  { tag: '9F3D', name: 'Currency Exponent, Transaction Reference', description: 'Indicates the implied position of the decimal point for transaction reference currency.', source: 'Terminal', format: 'n', length: '1 byte', type: 'constructed' },
  { tag: '9F40', name: 'Additional Terminal Capabilities (ATC)', description: 'Indicates the data input and output capabilities of the Terminal.', source: 'Terminal', format: 'binary', length: '5 bytes', type: 'primitive' },
  { tag: '9F41', name: 'Transaction Sequence Counter', description: 'Counter incremented for each transaction performed by the terminal.', source: 'Terminal', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '9F42', name: 'Currency Code, Application', description: 'Indicates the currency in which the account is managed according to ISO 4217.', source: 'Card', format: 'n', length: '2 bytes', type: 'primitive' },
  { tag: '9F44', name: 'Currency Exponent, Application', description: 'Indicates the implied position of the decimal point from the right of the amount.', source: 'Card', format: 'n', length: '1 byte', type: 'primitive' },
  { tag: '9F45', name: 'Data Authentication Code', description: 'An issuer assigned value that is retained by the terminal during SDA verification.', source: 'Card', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9F46', name: 'ICC Public Key Certificate', description: 'ICC Public Key certified by the issuer.', source: 'Card', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '9F47', name: 'ICC Public Key Exponent', description: 'ICC Public Key Exponent used for verification of Signed Dynamic Application Data.', source: 'Card', format: 'binary', length: '1-3 bytes', type: 'primitive' },
  { tag: '9F48', name: 'ICC Public Key Remainder', description: 'Digits of the ICC Public Key Modulus which do not fit within the ICC Public Key Certificate.', source: 'Card', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '9F49', name: 'Dynamic Data Authentication Data Object List (DDOL)', description: 'List of data objects to be passed to the ICC in INTERNAL AUTHENTICATE command.', source: 'Card', format: 'binary', length: '0-252 bytes', type: 'primitive' },
  { tag: '9F4A', name: 'Static Data Authentication Tag List (SDA)', description: 'List of tags whose value fields are to be included in Signed Static or Dynamic Application Data.', source: 'Card', format: 'variable', length: 'variable', type: 'primitive' },
  { tag: '9F4B', name: 'Signed Dynamic Application Data (SDAD)', description: 'Digital signature on critical application parameters for DDA or CDA.', source: 'Card', format: 'binary', length: 'variable', type: 'primitive' },
  { tag: '9F4C', name: 'ICC Dynamic Number', description: 'Time-variant number generated by the ICC, to be captured by the terminal.', source: 'Card', format: 'binary', length: '2-8 bytes', type: 'primitive' },
  { tag: '9F4D', name: 'Log Entry', description: 'Provides the SFI of the Transaction Log file and its number of records.', source: 'Card', format: 'binary', length: '2 bytes', type: 'primitive' },
  { tag: '9F4E', name: 'Merchant Name and Location', description: 'Indicates the name and location of the merchant.', source: 'Terminal', format: 'ans', length: 'variable', type: 'primitive' },
  { tag: '9F4F', name: 'Log Format', description: 'List of data objects representing the logged data elements passed to the terminal.', source: 'Card', format: 'binary', length: 'variable', type: 'primitive' },

  // Proprietary Tags
  { tag: 'BF0C', name: 'FCI Issuer Discretionary Data', description: 'Issuer discretionary part of the File Control Information Proprietary Template.', source: 'Card', format: 'binary', length: '0-222 bytes', type: 'primitive' },

  // Visa Proprietary Tags (DFxx)
  { tag: 'DF60', name: 'DS Input (Card)', description: 'Contains Terminal provided data for permanent data storage in the Card.', source: 'Data', format: 'binary', length: '8 bytes', type: 'primitive' },
  { tag: 'DF61', name: 'DS Digest H', description: 'Result of OWHF2(DS Input (Term)) or OWHF2AES(DS Input (Term)).', source: 'Data', format: 'binary', length: '8 bytes', type: 'primitive' },
  { tag: 'DF62', name: 'DS ODS Info', description: 'Terminal provided data to be forwarded to the Card with GENERATE AC command.', source: 'Data', format: 'binary', length: '1 byte', type: 'primitive' },
  { tag: 'DF63', name: 'DS ODS Term', description: 'Terminal provided data to be forwarded to the Card with GENERATE AC command.', source: 'Data', format: 'binary', length: '0-160 bytes', type: 'primitive' },
];

const TAG_CATEGORIES = [
  { id: 'all', label: 'All Tags', color: 'slate' },
  { id: 'card', label: 'Card Data', color: 'blue' },
  { id: 'terminal', label: 'Terminal Data', color: 'green' },
  { id: 'issuer', label: 'Issuer Data', color: 'purple' },
  { id: 'template', label: 'Templates', color: 'amber' },
  { id: 'cryptogram', label: 'Cryptogram', color: 'red' },
  { id: 'proprietary', label: 'Proprietary', color: 'indigo' },
];

export function EmvNfcTags({ className = '' }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<EmvTag | null>(null);

  const filteredTags = useMemo(() => {
    return EMV_TAGS.filter(tag => {
      const matchesSearch = !searchQuery.trim() ||
        tag.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.source.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || (() => {
        switch (selectedCategory) {
          case 'card': return tag.source === 'Card';
          case 'terminal': return tag.source === 'Terminal';
          case 'issuer': return tag.source === 'Issuer';
          case 'template': return tag.name.includes('Template') || tag.type === 'constructed';
          case 'cryptogram': return tag.name.includes('Cryptogram') || tag.name.includes('Authentication') || tag.name.includes('DDA') || tag.name.includes('SDA');
          case 'proprietary': return tag.tag.startsWith('DF') || tag.tag.startsWith('BF');
          default: return true;
        }
      })();

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      Card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Terminal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Issuer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      Data: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return colors[source] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  const getTypeColor = (type: string) => {
    return type === 'constructed'
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
      : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-500';
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">
          EMV & NFC Tags Reference
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Complete list of EMV and NFC tags with descriptions, sources, and formats
        </p>
      </div>

      {/* Search */}
      <div className="mb-3 sm:mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by tag, name, description, or source..."
          className="w-full px-3 py-2 sm:px-4 text-sm border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Category Filters */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
        {TAG_CATEGORIES.map(cat => {
          const count = cat.id === 'all' ? EMV_TAGS.length :
            cat.id === 'card' ? EMV_TAGS.filter(t => t.source === 'Card').length :
            cat.id === 'terminal' ? EMV_TAGS.filter(t => t.source === 'Terminal').length :
            cat.id === 'issuer' ? EMV_TAGS.filter(t => t.source === 'Issuer').length :
            cat.id === 'template' ? EMV_TAGS.filter(t => t.name.includes('Template') || t.type === 'constructed').length :
            cat.id === 'cryptogram' ? EMV_TAGS.filter(t => t.name.includes('Cryptogram') || t.name.includes('Authentication')).length :
            EMV_TAGS.filter(t => t.tag.startsWith('DF') || t.tag.startsWith('BF')).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredTags.length} of {EMV_TAGS.length} tags
      </div>

      {/* Tags Table - Card Layout on Mobile, Table on Larger Screens */}
      <div className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
        {/* Mobile Card Layout */}
        <div className="sm:hidden">
          {filteredTags.map((tag, idx) => (
            <div
              key={`${tag.tag}-${idx}`}
              className="p-3 border-b border-slate-200 dark:border-zinc-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
              onClick={() => setSelectedTag(tag)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                  {tag.tag}
                </span>
                <div className="flex gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getSourceColor(tag.source)}`}>
                    {tag.source}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getTypeColor(tag.type)}`}>
                    {tag.type === 'constructed' ? 'C' : 'P'}
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                {tag.name}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-500 dark:text-zinc-500">
                <span className="font-mono">{tag.format}</span>
                <span>•</span>
                <span>{tag.length}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                <th className="text-left py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[80px]">Tag</th>
                <th className="text-left py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[70px]">Source</th>
                <th className="text-left py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                <th className="text-left py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell min-w-[80px]">Format</th>
                <th className="text-left py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300 hidden xl:table-cell min-w-[100px]">Length</th>
                <th className="text-left py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[60px]">Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag, idx) => (
                <tr
                  key={`${tag.tag}-${idx}`}
                  className="border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTag(tag)}
                >
                  <td className="py-2 px-3 sm:py-3 sm:px-4 whitespace-nowrap">
                    <span className="font-mono text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                      {tag.tag}
                    </span>
                  </td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getSourceColor(tag.source)}`}>
                      {tag.source}
                    </span>
                  </td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4 text-slate-700 dark:text-slate-300">
                    {tag.name}
                  </td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4 font-mono text-xs text-slate-600 dark:text-zinc-400 hidden lg:table-cell">
                    {tag.format}
                  </td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4 text-xs text-slate-600 dark:text-zinc-400 hidden xl:table-cell">
                    {tag.length}
                  </td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(tag.type)}`}>
                      {tag.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTags.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-zinc-500">
          <p className="text-sm sm:text-base">No EMV tags found matching your search.</p>
        </div>
      )}

      {/* Tag Detail Modal */}
      {selectedTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setSelectedTag(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white font-mono truncate">
                  {selectedTag.tag}
                </h2>
                <h3 className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
                  {selectedTag.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTag(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl sm:text-3xl ml-2 shrink-0"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 mb-1">Source</p>
                  <span className={`px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${getSourceColor(selectedTag.source)}`}>
                    {selectedTag.source}
                  </span>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 mb-1">Format</p>
                  <p className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">{selectedTag.format}</p>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 mb-1">Length</p>
                  <p className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">{selectedTag.length}</p>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 mb-1">Type</p>
                  <span className={`px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${getTypeColor(selectedTag.type)}`}>
                    {selectedTag.type}
                  </span>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Description</h4>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  {selectedTag.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">Tag Format Codes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 sm:gap-4 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
          <div><span className="font-mono font-bold">n</span> - Numeric (digits 0-9)</div>
          <div><span className="font-mono font-bold">a</span> - Alphabetic (a-z, A-Z)</div>
          <div><span className="font-mono font-bold">an</span> - Alphanumeric</div>
          <div><span className="font-mono font-bold">ans</span> - Alphanumeric + special</div>
          <div><span className="font-mono font-bold">cn</span> - Compressed numeric</div>
          <div><span className="font-mono font-bold">binary</span> - Binary data</div>
          <div><span className="font-mono font-bold">H</span> - Hexadecimal</div>
          <div><span className="font-mono font-bold">var.</span> - Variable length</div>
        </div>
      </div>

      {/* Source */}
      <div className="mt-4 text-[10px] sm:text-xs text-slate-400 dark:text-zinc-600 text-center">
        Source: <a href="https://www.eftlab.com/knowledge-base/complete-list-of-emv-nfc-tags" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">EFT Lab</a>
      </div>
    </div>
  );
}

export default EmvNfcTags;
