interface Props {
  distanceKm: number
  driveTime: string
  chargingStops: number
  arrivalBattery: number
}

export default function RouteSummary({
  distanceKm,
  driveTime,
  chargingStops,
  arrivalBattery
}: Props) {

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white rounded-xl shadow p-5">

      <h3 className="font-semibold mb-3">Trip Summary</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

        <div>
          <div className="text-gray-500">Distance</div>
          <div className="font-semibold">{distanceKm} km</div>
        </div>

        <div>
          <div className="text-gray-500">Drive time</div>
          <div className="font-semibold">{driveTime}</div>
        </div>

        <div>
          <div className="text-gray-500">Charging stops</div>
          <div className="font-semibold">{chargingStops}</div>
        </div>

        <div>
          <div className="text-gray-500">Arrival battery</div>
          <div className="font-semibold">{arrivalBattery}%</div>
        </div>

      </div>
    </div>
  )
}