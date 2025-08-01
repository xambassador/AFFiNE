// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class ReadAllNotificationsMutation: GraphQLMutation {
  public static let operationName: String = "readAllNotifications"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation readAllNotifications { readAllNotifications }"#
    ))

  public init() {}

  public struct Data: AffineGraphQL.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AffineGraphQL.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("readAllNotifications", Bool.self),
    ] }

    /// mark all notifications as read
    public var readAllNotifications: Bool { __data["readAllNotifications"] }
  }
}
