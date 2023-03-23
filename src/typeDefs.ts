import { gql } from 'apollo-server-express';
import { CURRENCY_CODES } from './utils/currency';

const typeDefs = gql`
  type Price {
    priceHash: String!
    purchaseOption: String
    unit: String!
    USD: String!
    ${CURRENCY_CODES.map((code) => `${code}: String`).join('\n')}
    effectiveDateStart: String
    effectiveDateEnd: String
    startUsageAmount: String
    endUsageAmount: String
    description: String
    termLength: String
    termPurchaseOption: String
    termOfferingClass: String
  }

  type Emission {
    emissionHash: String!
    unit: String!
    emissions: String!
    effectiveDateStart: String
    effectiveDateEnd: String
    startUsageAmount: String
    endUsageAmount: String
    description: String
  }

  type Product {
    productHash: String!
    vendorName: String!
    service: String!
    productFamily: String
    region: String
    sku: String!
    attributes: [Attribute]
    prices(filter: PriceFilter): [Price]
    emissions(filter: EmissionFilter): [Emission]
  }

  type Attribute {
    key: String!
    value: String
  }

  input AttributeFilter {
    key: String!
    value: String
    value_regex: String
  }

  input ProductFilter {
    vendorName: String
    service: String
    productFamily: String
    region: String
    sku: String
    attributeFilters: [AttributeFilter]
  }

  input PriceFilter {
    purchaseOption: String
    unit: String
    description: String
    description_regex: String
    startUsageAmount: String
    endUsageAmount: String
    termLength: String
    termPurchaseOption: String
    termOfferingClass: String
  }

  input EmissionFilter {
    unit: String
    description: String
    description_regex: String
    startUsageAmount: String
    endUsageAmount: String
  }

  type Query {
    products(filter: ProductFilter): [Product]
  }
`;

export default typeDefs;
